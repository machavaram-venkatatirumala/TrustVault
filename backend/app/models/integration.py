import uuid
from datetime import datetime
from ..extensions import db


class OIDCConfiguration(db.Model):
    """Enterprise Single Sign-On (OIDC) connection parameters."""

    __tablename__ = "oidc_configurations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    issuer_url = db.Column(db.String(255), nullable=False)
    client_id = db.Column(db.String(255), nullable=False)
    client_secret_hash = db.Column(db.String(255), nullable=False)
    redirect_uri = db.Column(db.String(255), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = db.relationship("Organization")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "issuer_url": self.issuer_url,
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "is_enabled": self.is_enabled,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TenantQuota(db.Model):
    """Enforced resource and capacity boundaries for workspaces."""

    __tablename__ = "tenant_quotas"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False, index=True
    )
    max_storage_bytes = db.Column(db.BigInteger, default=5 * 1024 * 1024 * 1024, nullable=False)  # 5 GB default
    max_upload_size_bytes = db.Column(db.BigInteger, default=100 * 1024 * 1024, nullable=False)  # 100 MB default
    max_members = db.Column(db.Integer, default=50, nullable=False)
    max_api_rate_per_min = db.Column(db.Integer, default=120, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = db.relationship("Organization")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "max_storage_bytes": self.max_storage_bytes,
            "max_upload_size_bytes": self.max_upload_size_bytes,
            "max_members": self.max_members,
            "max_api_rate_per_min": self.max_api_rate_per_min,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class FeatureFlag(db.Model):
    """Server-evaluated feature toggles with tenant overrides."""

    __tablename__ = "feature_flags"
    __table_args__ = (
        db.UniqueConstraint("organization_id", "flag_key", name="uq_org_flag"),
    )

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = db.Column(
        db.String(36), db.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    flag_key = db.Column(db.String(64), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "flag_key": self.flag_key,
            "is_enabled": self.is_enabled,
            "description": self.description,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
