import uuid
from datetime import datetime
from ..extensions import db


class AccessReviewCampaign(db.Model):
    """Periodic administrative campaign to audit and confirm access grants."""

    __tablename__ = "access_review_campaigns"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = db.Column(db.String(180), nullable=False)
    reviewer_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(32), default="active", nullable=False)  # active, completed, canceled
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    reviewer = db.relationship("User")
    items = db.relationship("AccessReviewItem", back_populates="campaign", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "title": self.title,
            "reviewer_name": self.reviewer.full_name if self.reviewer else None,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "status": self.status,
            "items_count": len(self.items),
            "decided_count": len([i for i in self.items if i.decision is not None]),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AccessReviewItem(db.Model):
    """Specific grant undergoing review within an access campaign."""

    __tablename__ = "access_review_items"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = db.Column(
        db.String(36), db.ForeignKey("access_review_campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    permission_id = db.Column(
        db.String(36), db.ForeignKey("document_permissions.id", ondelete="CASCADE"), nullable=False
    )
    decision = db.Column(db.String(32), nullable=True)  # 'confirm', 'remove', 'investigate'
    notes = db.Column(db.Text, nullable=True)
    decided_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    campaign = db.relationship("AccessReviewCampaign", back_populates="items")
    permission = db.relationship("DocumentPermission")

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "permission_id": self.permission_id,
            "document_name": self.permission.document.original_filename if self.permission and self.permission.document else None,
            "recipient_email": self.permission.recipient_email if self.permission else None,
            "permission_level": self.permission.permission_level if self.permission else None,
            "decision": self.decision,
            "notes": self.notes,
            "decided_at": self.decided_at.isoformat() if self.decided_at else None,
        }
