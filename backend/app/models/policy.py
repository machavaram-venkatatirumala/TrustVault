import uuid
import json
from datetime import datetime
from ..extensions import db


class SecurityPolicy(db.Model):
    """Declarative security & governance automation policy."""

    __tablename__ = "security_policies"

    TYPE_AUTO_EXPIRE_EXTERNAL = "auto_expire_external"
    TYPE_REQUIRE_APPROVAL_SENSITIVE = "require_approval_sensitive"
    TYPE_PREVENT_PUBLIC_RESTRICTED = "prevent_public_restricted"
    TYPE_ELEVATED_JUSTIFICATION = "elevated_justification"
    TYPE_STORAGE_QUOTA = "storage_quota"
    TYPE_REAPPROVAL_ON_VERSION_CHANGE = "reapproval_on_version_change"
    TYPE_DOWNLOAD_RESTRICTION = "download_restriction"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = db.Column(db.String(120), nullable=False)
    policy_type = db.Column(db.String(64), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    config_json = db.Column(db.Text, nullable=False, default="{}")
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)
    priority = db.Column(db.Integer, default=100, nullable=False)  # Lower number = higher priority
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    @property
    def config(self):
        try:
            return json.loads(self.config_json or "{}")
        except:
            return {}

    @config.setter
    def config(self, value):
        self.config_json = json.dumps(value or {})

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "policy_type": self.policy_type,
            "description": self.description,
            "config": self.config,
            "is_enabled": self.is_enabled,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PolicyExecutionLog(db.Model):
    """Audit log of policy evaluations and deterministic enforcement decisions."""

    __tablename__ = "policy_execution_logs"
    __table_args__ = (
        db.Index("idx_policy_log_org_time", "organization_id", "executed_at"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    policy_id = db.Column(
        db.String(36), db.ForeignKey("security_policies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action = db.Column(db.String(64), nullable=False)
    decision = db.Column(db.String(32), nullable=False)  # allow, deny, require_approval, require_justification
    reason = db.Column(db.Text, nullable=False)
    target_type = db.Column(db.String(64), nullable=True)
    target_id = db.Column(db.String(64), nullable=True)
    actor_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    executed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    policy = db.relationship("SecurityPolicy")
    actor = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "policy_id": self.policy_id,
            "policy_name": self.policy.name if self.policy else "Default Guardrail",
            "action": self.action,
            "decision": self.decision,
            "reason": self.reason,
            "target_type": self.target_type,
            "target_id": self.target_id,
            "actor_name": self.actor.full_name if self.actor else None,
            "actor_email": self.actor.email if self.actor else None,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
        }
