from datetime import datetime
from ..extensions import db
from ..models import (
    Document,
    DocumentVersion,
    ApprovalWorkflowTemplate,
    ApprovalWorkflowInstance,
    ApprovalDecision,
    User,
    OrganizationMembership,
)
from ..errors.handlers import APIError
from .audit_service import AuditService


class ApprovalService:
    """Document approval workflow state machine with version content hash binding and separation of duties."""

    @staticmethod
    def list_templates(organization_id: str) -> list:
        templates = ApprovalWorkflowTemplate.query.filter_by(
            organization_id=organization_id, is_active=True
        ).order_by(ApprovalWorkflowTemplate.created_at.desc()).all()
        return [t.to_dict() for t in templates]

    @staticmethod
    def create_template(organization_id: str, data: dict, actor: User) -> dict:
        import json
        tpl = ApprovalWorkflowTemplate(
            organization_id=organization_id,
            name=data.get("name", "Standard Review Workflow"),
            description=data.get("description"),
            steps_json=json.dumps(data.get("steps", [])),
            is_active=True,
        )
        db.session.add(tpl)
        db.session.commit()
        return {"template": tpl.to_dict()}

    @staticmethod
    def list_workflows(organization_id: str, status: str = None) -> list:
        query = ApprovalWorkflowInstance.query.filter_by(organization_id=organization_id)
        if status:
            query = query.filter_by(status=status)
        workflows = query.order_by(ApprovalWorkflowInstance.created_at.desc()).all()
        return [w.to_dict() for w in workflows]

    @staticmethod
    def submit_for_approval(
        document_id: str,
        organization_id: str,
        actor: User,
        template_id: str = None,
        submission_notes: str = None,
    ) -> dict:
        document = Document.query.filter_by(
            id=document_id, organization_id=organization_id, status="active"
        ).first()
        if not document:
            raise APIError("Document not found or access denied.", status_code=404)

        # Retrieve active version record
        current_version = DocumentVersion.query.filter_by(
            document_id=document.id, version_number=document.current_version_number
        ).first()
        version_hash = current_version.sha256_hash if current_version else document.sha256_hash
        version_id = current_version.id if current_version else None

        # Check if there is already an open workflow for this exact version
        existing_open = ApprovalWorkflowInstance.query.filter_by(
            document_id=document.id,
            version_hash=version_hash,
        ).filter(ApprovalWorkflowInstance.status.in_([
            ApprovalWorkflowInstance.STATUS_SUBMITTED,
            ApprovalWorkflowInstance.STATUS_IN_REVIEW,
        ])).first()

        if existing_open:
            return existing_open.to_dict()

        instance = ApprovalWorkflowInstance(
            organization_id=organization_id,
            document_id=document.id,
            document_version_id=version_id,
            version_hash=version_hash,
            template_id=template_id,
            status=ApprovalWorkflowInstance.STATUS_IN_REVIEW,
            submitter_id=actor.id,
            current_step_index=0,
            submission_notes=submission_notes.strip() if submission_notes else None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.session.add(instance)
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="approval.workflow_submitted",
            resource_type="document",
            resource_id=document.id,
            outcome="success",
            metadata={
                "workflow_id": instance.id,
                "version_number": document.current_version_number,
                "version_hash": version_hash,
            },
        )

        return instance.to_dict()

    @staticmethod
    def render_decision(
        workflow_id: str,
        organization_id: str,
        actor: User,
        decision: str,  # 'approve', 'reject', 'request_changes'
        comment: str = None,
    ) -> dict:
        norm_decision = str(decision).lower().strip()
        if norm_decision == "approved":
            norm_decision = "approve"
        elif norm_decision == "rejected":
            norm_decision = "reject"
        elif norm_decision == "changes_requested":
            norm_decision = "request_changes"

        valid_decisions = ["approve", "reject", "request_changes"]
        if norm_decision not in valid_decisions:
            raise APIError(f"Invalid decision '{decision}'. Must be one of: {', '.join(valid_decisions)}", status_code=400)

        instance = ApprovalWorkflowInstance.query.filter_by(
            id=workflow_id, organization_id=organization_id
        ).first()
        if not instance:
            raise APIError("Approval workflow instance not found.", status_code=404)

        if instance.status in [ApprovalWorkflowInstance.STATUS_APPROVED, ApprovalWorkflowInstance.STATUS_REJECTED, ApprovalWorkflowInstance.STATUS_CANCELED]:
            # Idempotent response for retries: return existing state without duplicate decision
            return instance.to_dict()

        # 1. Separation of Duties: Submitter cannot approve their own submission
        if norm_decision == "approve" and instance.submitter_id == actor.id:
            raise APIError("Separation of duties violation: Submitters cannot approve their own document submissions.", status_code=403)

        # 2. Check reviewer eligibility (must be admin or member of workspace)
        membership = OrganizationMembership.query.filter_by(
            organization_id=organization_id, user_id=actor.id, status="active"
        ).first()
        if not membership:
            raise APIError("You are not an active member of this workspace.", status_code=403)

        # 3. Version content integrity check:
        # Check if the document was altered since the workflow was initiated
        document = Document.query.get(instance.document_id)
        if document and document.sha256_hash != instance.version_hash:
            instance.status = ApprovalWorkflowInstance.STATUS_CHANGES_REQUESTED
            db.session.commit()
            raise APIError(
                "Document content changed after this workflow was submitted! "
                "The approval has been invalidated for the modified content. Resubmission required.",
                status_code=409,
            )

        # 4. Mandatory comment on rejection or change request
        if decision in ["reject", "request_changes"] and (not comment or len(comment.strip()) < 3):
            raise APIError("A descriptive comment or reason is required when rejecting or requesting changes.", status_code=400)

        # 5. Idempotent check: has this reviewer already made the identical decision?
        last_decision = ApprovalDecision.query.filter_by(
            workflow_instance_id=instance.id,
            reviewer_id=actor.id,
            step_index=instance.current_step_index,
        ).order_by(ApprovalDecision.decision_at.desc()).first()

        if last_decision and last_decision.decision == decision:
            return instance.to_dict()

        # Record decision record
        decision_rec = ApprovalDecision(
            workflow_instance_id=instance.id,
            step_index=instance.current_step_index,
            reviewer_id=actor.id,
            decision=decision,
            comment=comment.strip() if comment else None,
            version_hash_snapshot=instance.version_hash,
            decision_at=datetime.utcnow(),
        )
        db.session.add(decision_rec)

        # State transition
        norm_decision = str(decision).lower().strip()
        if norm_decision in ["approve", "approved"]:
            instance.status = ApprovalWorkflowInstance.STATUS_APPROVED
        elif norm_decision in ["reject", "rejected"]:
            instance.status = ApprovalWorkflowInstance.STATUS_REJECTED
        elif norm_decision in ["request_changes", "changes_requested"]:
            instance.status = ApprovalWorkflowInstance.STATUS_CHANGES_REQUESTED

        instance.updated_at = datetime.utcnow()
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action=f"approval.decision_{decision}",
            resource_type="document",
            resource_id=instance.document_id,
            outcome="success",
            metadata={
                "workflow_id": instance.id,
                "decision": decision,
                "comment": comment,
                "version_hash": instance.version_hash,
            },
        )

        return instance.to_dict()

    @staticmethod
    def cancel_workflow(workflow_id: str, organization_id: str, actor: User) -> dict:
        instance = ApprovalWorkflowInstance.query.filter_by(
            id=workflow_id, organization_id=organization_id
        ).first()
        if not instance:
            raise APIError("Approval workflow instance not found.", status_code=404)

        instance.status = ApprovalWorkflowInstance.STATUS_CANCELED
        instance.updated_at = datetime.utcnow()
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="approval.workflow_canceled",
            resource_type="document",
            resource_id=instance.document_id,
            outcome="success",
            metadata={"workflow_id": instance.id},
        )

        return instance.to_dict()
