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
        items_list = self.items or []
        completed_count = len([i for i in items_list if i.decision is not None])
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "title": self.title,
            "reviewer_name": self.reviewer.full_name if self.reviewer else None,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "due_date": self.deadline.isoformat() if self.deadline else None,
            "status": self.status,
            "items_count": len(items_list),
            "total_items": len(items_list),
            "decided_count": completed_count,
            "completed_items": completed_count,
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
    decision = db.Column(db.String(32), nullable=True)  # 'confirmed', 'revoked', 'pending'
    notes = db.Column(db.Text, nullable=True)
    decided_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    campaign = db.relationship("AccessReviewCampaign", back_populates="items")
    permission = db.relationship("DocumentPermission")

    def to_dict(self):
        perm = self.permission
        doc = perm.document if perm else None
        recip = perm.recipient_user if perm else None

        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "permission_id": self.permission_id,
            "document_name": doc.original_filename if doc else None,
            "recipient_name": recip.full_name if recip else None,
            "recipient_email": recip.email if recip else None,
            "permission_level": perm.permission_level if perm else None,
            "granted_at": perm.created_at.isoformat() if perm and perm.created_at else None,
            "expires_at": perm.expires_at.isoformat() if perm and perm.expires_at else None,
            "decision": self.decision or "pending",
            "notes": self.notes,
            "decided_at": self.decided_at.isoformat() if self.decided_at else None,
        }
