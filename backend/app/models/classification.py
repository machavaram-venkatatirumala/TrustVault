import uuid
from datetime import datetime
from ..extensions import db


class DocumentClassificationHistory(db.Model):
    """Tracks historical classification transitions and audit justifications."""

    __tablename__ = "document_classification_history"
    __table_args__ = (
        db.Index("idx_class_doc_created", "document_id", "created_at"),
        db.Index("idx_class_org_created", "organization_id", "created_at"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id = db.Column(
        db.String(36), db.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    previous_classification = db.Column(db.String(32), nullable=True)
    new_classification = db.Column(db.String(32), nullable=False)
    reason = db.Column(db.Text, nullable=True)
    changed_by_user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = db.relationship("Document", backref=db.backref("classification_history", cascade="all, delete-orphan", lazy="dynamic"))
    changed_by = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "organization_id": self.organization_id,
            "previous_classification": self.previous_classification,
            "new_classification": self.new_classification,
            "reason": self.reason,
            "changed_by_name": self.changed_by.full_name if self.changed_by else None,
            "changed_by_email": self.changed_by.email if self.changed_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
