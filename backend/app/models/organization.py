import uuid
from datetime import datetime
from ..extensions import db


class Organization(db.Model):
    """Organization / Workspace tenant entity."""

    __tablename__ = "organizations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(120), nullable=False)
    slug = db.Column(db.String(120), unique=True, nullable=False, index=True)
    workspace_type = db.Column(db.String(20), default="personal", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    memberships = db.relationship(
        "OrganizationMembership",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    documents = db.relationship(
        "Document",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    audit_logs = db.relationship(
        "AuditLog",
        back_populates="organization",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "workspace_type": self.workspace_type or "personal",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
