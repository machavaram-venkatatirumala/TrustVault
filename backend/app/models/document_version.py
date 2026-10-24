import uuid
from datetime import datetime
from ..extensions import db


class DocumentVersion(db.Model):
    """Immutable version artifact for a document."""

    __tablename__ = "document_versions"
    __table_args__ = (
        db.UniqueConstraint("document_id", "version_number", name="uq_doc_version"),
        db.Index("idx_doc_ver_doc_created", "document_id", "created_at"),
        db.Index("idx_doc_ver_hash", "sha256_hash"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = db.Column(
        db.String(36), db.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number = db.Column(db.Integer, nullable=False, default=1)
    storage_key = db.Column(db.String(512), index=True, nullable=False)
    content_type = db.Column(db.String(128), nullable=False)
    size_bytes = db.Column(db.BigInteger, nullable=False)
    sha256_hash = db.Column(db.String(64), nullable=False)
    scan_status = db.Column(db.String(32), default="clean", nullable=False)  # 'clean', 'pending', 'quarantined', 'skipped'
    scan_result = db.Column(db.String(255), nullable=True)
    change_summary = db.Column(db.String(255), nullable=True)

    created_by = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    document = db.relationship("Document", back_populates="versions")
    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "version_number": self.version_number,
            "storage_key": self.storage_key,
            "content_type": self.content_type,
            "size_bytes": self.size_bytes,
            "sha256_hash": self.sha256_hash,
            "scan_status": self.scan_status,
            "scan_result": self.scan_result,
            "change_summary": self.change_summary or f"Version {self.version_number}",
            "created_by": self.created_by,
            "creator_name": self.creator.full_name if self.creator else "Unknown",
            "creator_email": self.creator.email if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
