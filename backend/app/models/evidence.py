import uuid
import json
from datetime import datetime
from ..extensions import db


class EvidencePackage(db.Model):
    """Verifiable compliance evidence package bundle with deterministic SHA-256 manifest."""

    __tablename__ = "evidence_packages"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = db.Column(db.String(255), nullable=False)
    requested_by_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    date_from = db.Column(db.DateTime, nullable=True)
    date_to = db.Column(db.DateTime, nullable=True)
    categories_json = db.Column(db.Text, nullable=False, default="[]")
    manifest_json = db.Column(db.Text, nullable=True)  # File inventory & item digests
    sha256_manifest_hash = db.Column(db.String(64), nullable=True)
    file_path = db.Column(db.String(512), nullable=True)
    status = db.Column(db.String(32), default="ready", nullable=False)  # generating, ready, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    requested_by = db.relationship("User")

    @property
    def categories(self):
        try:
            return json.loads(self.categories_json or "[]")
        except:
            return []

    @categories.setter
    def categories(self, value):
        self.categories_json = json.dumps(value or [])

    @property
    def manifest(self):
        try:
            return json.loads(self.manifest_json or "{}")
        except:
            return {}

    @manifest.setter
    def manifest(self, value):
        self.manifest_json = json.dumps(value or {})

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "requested_by_name": self.requested_by.full_name if self.requested_by else None,
            "date_from": self.date_from.isoformat() if self.date_from else None,
            "date_to": self.date_to.isoformat() if self.date_to else None,
            "categories": self.categories,
            "sha256_manifest_hash": self.sha256_manifest_hash,
            "manifest": self.manifest,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
