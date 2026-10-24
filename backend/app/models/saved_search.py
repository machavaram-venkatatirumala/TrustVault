import uuid
import json
from datetime import datetime
from ..extensions import db


class SavedSearch(db.Model):
    """Reusable smart filter queries and saved searches."""

    __tablename__ = "saved_searches"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    filter_criteria_json = db.Column(db.Text, nullable=False, default="{}")
    is_shared = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User")

    @property
    def criteria(self):
        try:
            return json.loads(self.filter_criteria_json or "{}")
        except:
            return {}

    @criteria.setter
    def criteria(self, value):
        self.filter_criteria_json = json.dumps(value or {})

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "user_id": self.user_id,
            "creator_name": self.user.full_name if self.user else None,
            "name": self.name,
            "description": self.description,
            "criteria": self.criteria,
            "is_shared": self.is_shared,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
