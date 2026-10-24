import uuid
import json
from datetime import datetime
from ..extensions import db


class ApprovalWorkflowTemplate(db.Model):
    """Configurable workflow template with sequential approval steps."""

    __tablename__ = "approval_workflow_templates"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    steps_json = db.Column(db.Text, nullable=False, default="[]")  # List of step definitions
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @property
    def steps(self):
        try:
            return json.loads(self.steps_json or "[]")
        except:
            return []

    @steps.setter
    def steps(self, value):
        self.steps_json = json.dumps(value or [])

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "description": self.description,
            "steps": self.steps,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ApprovalWorkflowInstance(db.Model):
    """Specific document approval workflow execution bound to an immutable version hash."""

    __tablename__ = "approval_workflow_instances"
    __table_args__ = (
        db.Index("idx_approval_doc_status", "document_id", "status"),
        db.Index("idx_approval_org_status", "organization_id", "status"),
    )

    # Valid State Transitions
    STATUS_DRAFT = "draft"
    STATUS_SUBMITTED = "submitted"
    STATUS_IN_REVIEW = "in_review"
    STATUS_CHANGES_REQUESTED = "changes_requested"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CANCELED = "canceled"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id = db.Column(
        db.String(36), db.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_version_id = db.Column(
        db.String(36), db.ForeignKey("document_versions.id", ondelete="SET NULL"), nullable=True
    )
    version_hash = db.Column(db.String(64), nullable=False)  # Immutable bound SHA-256 hash
    template_id = db.Column(
        db.String(36), db.ForeignKey("approval_workflow_templates.id", ondelete="SET NULL"), nullable=True
    )
    status = db.Column(db.String(32), default=STATUS_SUBMITTED, nullable=False)
    submitter_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    current_step_index = db.Column(db.Integer, default=0, nullable=False)
    submission_notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    document = db.relationship("Document", backref=db.backref("approval_instances", cascade="all, delete-orphan", lazy="dynamic"))
    submitter = db.relationship("User", foreign_keys=[submitter_id])
    template = db.relationship("ApprovalWorkflowTemplate")
    decisions = db.relationship("ApprovalDecision", back_populates="workflow_instance", cascade="all, delete-orphan", order_by="ApprovalDecision.decision_at.asc()")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "document_id": self.document_id,
            "document_name": self.document.original_filename if self.document else None,
            "document_version_id": self.document_version_id,
            "version_hash": self.version_hash,
            "template_id": self.template_id,
            "template_name": self.template.name if self.template else "Standard Approval",
            "status": self.status,
            "submitter_id": self.submitter_id,
            "submitter_name": self.submitter.full_name if self.submitter else None,
            "submitter_email": self.submitter.email if self.submitter else None,
            "current_step_index": self.current_step_index,
            "submission_notes": self.submission_notes,
            "decisions": [d.to_dict() for d in self.decisions],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ApprovalDecision(db.Model):
    """Individual review decision rendered on a document approval workflow."""

    __tablename__ = "approval_decisions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_instance_id = db.Column(
        db.String(36), db.ForeignKey("approval_workflow_instances.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_index = db.Column(db.Integer, nullable=False, default=0)
    reviewer_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    decision = db.Column(db.String(32), nullable=False)  # 'approve', 'reject', 'request_changes'
    comment = db.Column(db.Text, nullable=True)
    version_hash_snapshot = db.Column(db.String(64), nullable=False)
    decision_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    workflow_instance = db.relationship("ApprovalWorkflowInstance", back_populates="decisions")
    reviewer = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "workflow_instance_id": self.workflow_instance_id,
            "step_index": self.step_index,
            "reviewer_id": self.reviewer_id,
            "reviewer_name": self.reviewer.full_name if self.reviewer else None,
            "reviewer_email": self.reviewer.email if self.reviewer else None,
            "decision": self.decision,
            "comment": self.comment,
            "version_hash_snapshot": self.version_hash_snapshot,
            "decision_at": self.decision_at.isoformat() if self.decision_at else None,
        }
