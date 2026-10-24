import json
import uuid
from datetime import datetime
from ..extensions import db


class ApiKey(db.Model):
    """Developer API credential with scoped access control."""

    __tablename__ = "api_keys"
    __table_args__ = (
        db.Index("idx_apikey_org", "organization_id", "revoked_at"),
        db.Index("idx_apikey_hash", "key_hash"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name = db.Column(db.String(120), nullable=False)
    key_prefix = db.Column(db.String(16), nullable=False)  # 'tv_live_XXXX...'
    key_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    scopes_json = db.Column(db.Text, nullable=False, default="[]")

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = db.Column(db.DateTime, nullable=True)
    revoked_at = db.Column(db.DateTime, nullable=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    # Relationships
    organization = db.relationship("Organization")
    user = db.relationship("User")

    @property
    def scopes(self):
        if not self.scopes_json:
            return []
        try:
            return json.loads(self.scopes_json)
        except Exception:
            return []

    @scopes.setter
    def scopes(self, value):
        self.scopes_json = json.dumps(value if value is not None else [])

    @property
    def is_active(self):
        return self.revoked_at is None

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "user_email": self.user.email if self.user else None,
            "name": self.name,
            "key_prefix": self.key_prefix,
            "scopes": self.scopes,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
        }
