import uuid
from datetime import datetime
from ..extensions import db


class OrganizationMembership(db.Model):
    """Organization membership entity linking users and organizations with roles."""

    __tablename__ = "organization_memberships"
    __table_args__ = (
        db.UniqueConstraint("organization_id", "user_id", name="uq_org_user"),
        db.Index("idx_org_user_role", "organization_id", "user_id", "role"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role = db.Column(db.String(20), nullable=False, default="member")  # 'admin' or 'member'
    status = db.Column(db.String(20), nullable=False, default="active")  # 'active', 'suspended'
    joined_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    organization = db.relationship("Organization", back_populates="memberships")
    user = db.relationship("User", back_populates="memberships")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "organization_name": self.organization.name if self.organization else None,
            "user_id": self.user_id,
            "user_email": self.user.email if self.user else None,
            "user_name": self.user.full_name if self.user else None,
            "role": self.role,
            "status": self.status,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }
