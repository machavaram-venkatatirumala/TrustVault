import uuid
from datetime import datetime
from ..extensions import db


class User(db.Model):
    """User account entity."""

    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    last_login_at = db.Column(db.DateTime, nullable=True)
    reset_token_hash = db.Column(db.String(64), nullable=True, index=True)
    reset_token_expires_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    memberships = db.relationship(
        "OrganizationMembership",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    owned_documents = db.relationship(
        "Document",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    received_permissions = db.relationship(
        "DocumentPermission",
        foreign_keys="DocumentPermission.recipient_user_id",
        back_populates="recipient_user",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_memberships=False):
        data = {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
        }
        if include_memberships:
            data["memberships"] = [m.to_dict() for m in self.memberships]
        return data
