import json
import uuid
from datetime import datetime
from ..extensions import db


class WebhookSubscription(db.Model):
    """Outbound webhook subscription entity."""

    __tablename__ = "webhook_subscriptions"
    __table_args__ = (
        db.Index("idx_webhook_org", "organization_id", "is_active"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_url = db.Column(db.String(512), nullable=False)
    secret = db.Column(db.String(64), nullable=False)  # Secret key for HMAC-SHA256 signature
    events_json = db.Column(db.Text, nullable=False, default="[]")  # e.g. ["document.upload", "permission.grant"]
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    deliveries = db.relationship(
        "WebhookDelivery",
        back_populates="subscription",
        cascade="all, delete-orphan",
        order_by="WebhookDelivery.created_at.desc()",
    )

    @property
    def subscribed_events(self):
        if not self.events_json:
            return []
        try:
            return json.loads(self.events_json)
        except Exception:
            return []

    @subscribed_events.setter
    def subscribed_events(self, value):
        self.events_json = json.dumps(value if value is not None else [])

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "target_url": self.target_url,
            "secret_preview": f"whsec_{self.secret[:6]}...",
            "events": self.subscribed_events,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "delivery_count": len(self.deliveries) if self.deliveries else 0,
        }


class WebhookDelivery(db.Model):
    """Log record of a dispatched webhook attempt."""

    __tablename__ = "webhook_deliveries"
    __table_args__ = (
        db.Index("idx_delivery_sub_created", "subscription_id", "created_at"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = db.Column(
        db.String(36), db.ForeignKey("webhook_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    event_type = db.Column(db.String(64), nullable=False)
    payload_json = db.Column(db.Text, nullable=False)
    status_code = db.Column(db.Integer, nullable=True)
    response_body = db.Column(db.Text, nullable=True)
    attempt_count = db.Column(db.Integer, default=1, nullable=False)
    delivered_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    subscription = db.relationship("WebhookSubscription", back_populates="deliveries")

    def to_dict(self):
        return {
            "id": self.id,
            "subscription_id": self.subscription_id,
            "event_type": self.event_type,
            "status_code": self.status_code,
            "response_body": self.response_body[:255] if self.response_body else None,
            "attempt_count": self.attempt_count,
            "delivered_at": self.delivered_at.isoformat() if self.delivered_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
