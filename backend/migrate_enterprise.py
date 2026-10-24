import sys
import os
import json
from sqlalchemy import text

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import (
    Organization,
    Document,
    SecurityPolicy,
    TenantQuota,
    FeatureFlag,
)

app = create_app()

def migrate_enterprise():
    with app.app_context():
        print("Starting Enterprise Schema Migration...")

        # 1. Add classification column to documents if missing
        engine = db.engine
        with engine.connect() as conn:
            columns_query = conn.execute(text("PRAGMA table_info(documents);")).fetchall()
            col_names = [row[1] for row in columns_query]
            if "classification" not in col_names:
                print("Adding 'classification' column to documents table...")
                conn.execute(text("ALTER TABLE documents ADD COLUMN classification VARCHAR(32) DEFAULT 'Internal' NOT NULL;"))
                conn.commit()
            else:
                print("'classification' column already present in documents.")

        # 2. Create any newly registered tables
        print("Creating newly registered enterprise tables...")
        db.create_all()

        # 3. Initialize default tenant quotas and policies for existing organizations
        orgs = Organization.query.all()
        for org in orgs:
            # Quota
            existing_quota = TenantQuota.query.filter_by(organization_id=org.id).first()
            if not existing_quota:
                quota = TenantQuota(
                    organization_id=org.id,
                    max_storage_bytes=10 * 1024 * 1024 * 1024, # 10 GB
                    max_upload_size_bytes=250 * 1024 * 1024,   # 250 MB
                    max_members=100,
                    max_api_rate_per_min=240,
                )
                db.session.add(quota)
                print(f"Created default TenantQuota for org: {org.name}")

            # Standard policies
            default_policies = [
                {
                    "name": "Auto-expire external share grants",
                    "type": SecurityPolicy.TYPE_AUTO_EXPIRE_EXTERNAL,
                    "desc": "Automatically set expiration on external recipient grants to max 7 days.",
                    "config": {"default_expiration_days": 7, "enforce_max": True},
                    "priority": 10,
                },
                {
                    "name": "Prevent public sharing of Restricted assets",
                    "type": SecurityPolicy.TYPE_PREVENT_PUBLIC_RESTRICTED,
                    "desc": "Disallow public share links on any document labeled Restricted.",
                    "config": {"blocked_classifications": ["Restricted"]},
                    "priority": 1,
                },
                {
                    "name": "Require approval for Confidential sharing",
                    "type": SecurityPolicy.TYPE_REQUIRE_APPROVAL_SENSITIVE,
                    "desc": "Require formal review before sharing Confidential documents externally.",
                    "config": {"require_for": ["Confidential", "Restricted"]},
                    "priority": 20,
                },
                {
                    "name": "Enforce workspace storage capacity",
                    "type": SecurityPolicy.TYPE_STORAGE_QUOTA,
                    "desc": "Halt uploads when workspace total storage reaches configured threshold.",
                    "config": {"enforce_hard_limit": True},
                    "priority": 5,
                },
            ]

            for p_def in default_policies:
                existing_p = SecurityPolicy.query.filter_by(
                    organization_id=org.id, policy_type=p_def["type"]
                ).first()
                if not existing_p:
                    pol = SecurityPolicy(
                        organization_id=org.id,
                        name=p_def["name"],
                        policy_type=p_def["type"],
                        description=p_def["desc"],
                        config_json=json.dumps(p_def["config"]),
                        is_enabled=True,
                        priority=p_def["priority"],
                    )
                    db.session.add(pol)
                    print(f"Created policy '{p_def['name']}' for org: {org.name}")

            # Feature flags
            flags = [
                ("visual_permission_explorer", True, "Interactive access graph and effective permission explorer"),
                ("document_approval_workflows", True, "Version-bound document review state machine"),
                ("policy_automation_engine", True, "Automated compliance and guardrail policy enforcement"),
                ("compliance_evidence_center", True, "Verifiable evidence export bundles with SHA-256 manifests"),
                ("external_collaborator_portal", True, "Restricted client & vendor document portal"),
                ("access_review_campaigns", True, "Periodic access audit and confirmation campaigns"),
                ("scim_provisioning", True, "SCIM 2.0 user and group directory synchronization"),
                ("oidc_sso", True, "OpenID Connect Single Sign-On federation"),
            ]
            for flag_key, is_en, desc in flags:
                existing_f = FeatureFlag.query.filter_by(
                    organization_id=org.id, flag_key=flag_key
                ).first()
                if not existing_f:
                    ff = FeatureFlag(
                        organization_id=org.id,
                        flag_key=flag_key,
                        is_enabled=is_en,
                        description=desc,
                    )
                    db.session.add(ff)

        db.session.commit()
        print("Enterprise Schema Migration Completed Successfully!")

if __name__ == "__main__":
    migrate_enterprise()
