import hashlib
import json
import uuid
from datetime import datetime
from ..extensions import db


def compute_canonical_hash(
    sequence_number: int,
    organization_id: str,
    created_at_iso: str,
    action: str,
    resource_type: str,
    resource_id: str,
    outcome: str,
    metadata_json: str,
    prev_event_hash: str,
) -> str:
    """Computes a canonical SHA-256 hash across tamper-evident audit record fields."""
    canonical_payload = (
        f"{sequence_number}|{organization_id}|{created_at_iso}|{action}|"
        f"{resource_type}|{resource_id or ''}|{outcome}|{metadata_json or ''}|"
        f"{prev_event_hash or 'GENESIS'}"
    )
    return hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()


class AuditLog(db.Model):
    """Immutable security audit trail entity with cryptographic hash-chaining."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        db.Index("idx_audit_org_created", "organization_id", "created_at"),
        db.Index("idx_audit_org_action", "organization_id", "action"),
        db.Index("idx_audit_org_seq", "organization_id", "sequence_number"),
        db.Index("idx_audit_resource", "resource_type", "resource_id"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    actor_user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action = db.Column(db.String(64), nullable=False)
    resource_type = db.Column(db.String(32), nullable=False)
    resource_id = db.Column(db.String(64), nullable=True)
    outcome = db.Column(db.String(20), nullable=False, default="success")  # 'success', 'denied', 'failure'

    # Hash chain provenance fields
    sequence_number = db.Column(db.Integer, nullable=True, index=True)
    prev_event_hash = db.Column(db.String(64), nullable=True)
    event_hash = db.Column(db.String(64), nullable=True, index=True)

    # Stores non-sensitive metadata as JSON string (fully portable across SQLite & PostgreSQL)
    metadata_json = db.Column(db.Text, nullable=True)

    request_id = db.Column(db.String(48), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    organization = db.relationship("Organization", back_populates="audit_logs")
    actor = db.relationship("User", foreign_keys=[actor_user_id])

    @property
    def actor_email(self):
        return self.actor.email if self.actor else None

    @property
    def event_metadata(self):
        if not self.metadata_json:
            return {}
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

    @event_metadata.setter
    def event_metadata(self, value):
        if not value:
            self.metadata_json = None
        else:
            self.metadata_json = json.dumps(value, sort_keys=True)

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "sequence_number": self.sequence_number,
            "prev_event_hash": self.prev_event_hash,
            "event_hash": self.event_hash,
            "actor_user_id": self.actor_user_id,
            "actor_name": self.actor.full_name if self.actor else "System",
            "actor_email": self.actor.email if self.actor else None,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "outcome": self.outcome,
            "metadata": self.event_metadata,
            "request_id": self.request_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
