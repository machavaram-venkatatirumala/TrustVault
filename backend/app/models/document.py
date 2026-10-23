import uuid
from datetime import datetime
from ..extensions import db


class Document(db.Model):
    """Confidential document entity."""

    __tablename__ = "documents"
    __table_args__ = (
        db.Index("idx_doc_org_created", "organization_id", "created_at"),
        db.Index("idx_doc_org_owner", "organization_id", "owner_id"),
        db.Index("idx_doc_hash", "sha256_hash"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    owner_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    original_filename = db.Column(db.String(255), nullable=False)
    storage_key = db.Column(db.String(512), unique=True, nullable=False)
    content_type = db.Column(db.String(128), nullable=False)
    size_bytes = db.Column(db.BigInteger, nullable=False)
    sha256_hash = db.Column(db.String(64), nullable=False)
    status = db.Column(db.String(32), default="active", nullable=False)  # 'active', 'deleted'
    last_verified_at = db.Column(db.DateTime, nullable=True)
    last_verification_status = db.Column(db.String(32), nullable=True)  # 'verified', 'mismatch', 'unavailable'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    deleted_at = db.Column(db.DateTime, nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    organization = db.relationship("Organization", back_populates="documents")
    owner = db.relationship("User", back_populates="owned_documents")
    permissions = db.relationship(
        "DocumentPermission",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_permissions=False):
        data = {
            "id": self.id,
            "organization_id": self.organization_id,
            "owner_id": self.owner_id,
            "owner_name": self.owner.full_name if self.owner else None,
            "owner_email": self.owner.email if self.owner else None,
            "original_filename": self.original_filename,
            "content_type": self.content_type,
            "size_bytes": self.size_bytes,
            "sha256_hash": self.sha256_hash,
            "status": self.status,
            "last_verified_at": self.last_verified_at.isoformat() if self.last_verified_at else None,
            "last_verification_status": self.last_verification_status or "unverified",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_permissions:
            data["permissions"] = [p.to_dict() for p in self.permissions if not p.revoked_at]
        return data
