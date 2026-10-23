import uuid
from datetime import datetime
from ..extensions import db


class DocumentPermission(db.Model):
    """Explicit permission grant for sharing documents."""

    __tablename__ = "document_permissions"
    __table_args__ = (
        db.Index("idx_perm_recipient_active", "recipient_user_id", "revoked_at"),
        db.Index("idx_perm_doc_active", "document_id", "revoked_at"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = db.Column(
        db.String(36), db.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    granted_by = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    recipient_user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    permission_level = db.Column(db.String(20), nullable=False, default="view")  # 'view', 'download'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    document = db.relationship("Document", back_populates="permissions")
    grantor = db.relationship("User", foreign_keys=[granted_by])
    recipient_user = db.relationship("User", foreign_keys=[recipient_user_id], back_populates="received_permissions")

    @property
    def is_active(self) -> bool:
        """Determines if the grant is currently active (not revoked and not expired)."""
        if self.revoked_at is not None:
            return False
        if self.expires_at is not None and self.expires_at < datetime.utcnow():
            return False
        return True

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "document_name": self.document.original_filename if self.document else None,
            "organization_id": self.organization_id,
            "granted_by": self.granted_by,
            "grantor_name": self.grantor.full_name if self.grantor else None,
            "recipient_user_id": self.recipient_user_id,
            "recipient_name": self.recipient_user.full_name if self.recipient_user else None,
            "recipient_email": self.recipient_user.email if self.recipient_user else None,
            "permission_level": self.permission_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
            "is_active": self.is_active,
        }
