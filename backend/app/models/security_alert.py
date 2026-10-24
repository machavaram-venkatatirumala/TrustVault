import json
import uuid
from datetime import datetime
from ..extensions import db


class SecurityAlert(db.Model):
    """Real security incident alert derived from backend operational telemetry."""

    __tablename__ = "security_alerts"
    __table_args__ = (
        db.Index("idx_alert_org_status", "organization_id", "status"),
        db.Index("idx_alert_org_created", "organization_id", "created_at"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    alert_type = db.Column(db.String(64), nullable=False)  # 'brute_force_access_denied', 'burst_download', 'tamper_mismatch', 'expiring_grants', 'malware_detected'
    severity = db.Column(db.String(20), nullable=False, default="warning")  # 'critical', 'warning', 'info'
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    evidence_json = db.Column(db.Text, nullable=True)

    status = db.Column(db.String(20), nullable=False, default="open")  # 'open', 'acknowledged', 'resolved'

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    organization = db.relationship("Organization")
    resolver = db.relationship("User", foreign_keys=[resolved_by])

    @property
    def evidence(self):
        if not self.evidence_json:
            return {}
        try:
            return json.loads(self.evidence_json)
        except Exception:
            return {}

    @evidence.setter
    def evidence(self, value):
        if value is None:
            self.evidence_json = None
        else:
            self.evidence_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "evidence": self.evidence,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "resolver_name": self.resolver.full_name if self.resolver else None,
        }
