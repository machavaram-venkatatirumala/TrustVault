from datetime import datetime
from ..extensions import db
from ..models import (
    Document,
    DocumentClassificationHistory,
    DocumentPermission,
    User,
    SecurityPolicy,
)
from ..errors.handlers import APIError
from .audit_service import AuditService


class ClassificationService:
    """Server-enforced document sensitivity classification and grant reevaluation."""

    VALID_CLASSIFICATIONS = ["Public", "Internal", "Confidential", "Restricted"]

    @staticmethod
    def update_classification(
        document_id: str,
        organization_id: str,
        new_classification: str,
        actor: User,
        reason: str = None,
    ) -> dict:
        if new_classification not in ClassificationService.VALID_CLASSIFICATIONS:
            raise APIError(
                f"Invalid classification '{new_classification}'. Must be one of: {', '.join(ClassificationService.VALID_CLASSIFICATIONS)}",
                status_code=400,
            )

        document = Document.query.filter_by(
            id=document_id, organization_id=organization_id, status="active"
        ).first()
        if not document:
            raise APIError("Document not found or access denied.", status_code=404)

        prev_classification = getattr(document, "classification", "Internal") or "Internal"
        if prev_classification == new_classification:
            return document.to_dict()

        # If downgrading from Restricted/Confidential, require an explicit reason
        sensitive_levels = ["Restricted", "Confidential"]
        if prev_classification in sensitive_levels and new_classification not in sensitive_levels:
            if not reason or len(reason.strip()) < 5:
                raise APIError(
                    f"A documented business justification (minimum 5 characters) is required when downgrading from {prev_classification} to {new_classification}.",
                    status_code=400,
                )

        # Apply update
        document.classification = new_classification
        document.updated_at = datetime.utcnow()

        # Record classification transition history
        history_entry = DocumentClassificationHistory(
            organization_id=organization_id,
            document_id=document.id,
            previous_classification=prev_classification,
            new_classification=new_classification,
            reason=reason.strip() if reason else None,
            changed_by_user_id=actor.id,
            created_at=datetime.utcnow(),
        )
        db.session.add(history_entry)

        # If upgraded to Restricted: Automatically revoke external public grants according to policy
        revoked_count = 0
        if new_classification == "Restricted":
            active_grants = DocumentPermission.query.filter_by(
                document_id=document.id, revoked_at=None
            ).all()
            for p in active_grants:
                # If external collaborator or general link
                if not p.recipient_user_id:
                    p.revoked_at = datetime.utcnow()
                    revoked_count += 1

        db.session.commit()

        # Append to cryptographic audit trail
        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="document.classification_change",
            resource_type="document",
            resource_id=document.id,
            outcome="success",
            metadata={
                "previous_classification": prev_classification,
                "new_classification": new_classification,
                "reason": reason,
                "revoked_external_grants": revoked_count,
            },
        )

        result = document.to_dict()
        result["revoked_external_grants"] = revoked_count
        return result

    @staticmethod
    def get_history(document_id: str, organization_id: str) -> list:
        history = (
            DocumentClassificationHistory.query.filter_by(
                document_id=document_id, organization_id=organization_id
            )
            .order_by(DocumentClassificationHistory.created_at.desc())
            .all()
        )
        return [h.to_dict() for h in history]
