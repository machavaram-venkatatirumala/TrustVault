import json
import uuid
from datetime import datetime
from ..extensions import db


class AuditLog(db.Model):
    """Immutable security audit trail entity."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        db.Index("idx_audit_org_created", "organization_id", "created_at"),
        db.Index("idx_audit_org_action", "organization_id", "action"),
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
    
    # Stores non-sensitive metadata as JSON string (fully portable across SQLite & PostgreSQL)
    metadata_json = db.Column(db.Text, nullable=True)
    
    request_id = db.Column(db.String(48), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    organization = db.relationship("Organization", back_populates="audit_logs")
    actor = db.relationship("User", foreign_keys=[actor_user_id])

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
        if value is None:
            self.metadata_json = None
        else:
            self.metadata_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
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
