import json
from datetime import datetime, timedelta
from ..extensions import db
from ..models import (
    SecurityPolicy,
    PolicyExecutionLog,
    Document,
    DocumentPermission,
    TenantQuota,
    User,
)
from ..errors.handlers import APIError
from .audit_service import AuditService


class PolicyService:
    """Deterministic server-side policy evaluation engine with explicit conflict precedence."""

    @staticmethod
    def list_policies(organization_id: str) -> list:
        policies = (
            SecurityPolicy.query.filter_by(organization_id=organization_id)
            .order_by(SecurityPolicy.priority.asc(), SecurityPolicy.created_at.desc())
            .all()
        )
        if not policies:
            defaults = [
                {
                    "name": "Auto-expire External Sharing",
                    "type": "auto_expire_external",
                    "desc": "Automatically revoke external collaborator sharing grants after 7 days.",
                    "config": {"days": 7},
                    "priority": 10,
                },
                {
                    "name": "Prevent Public Sharing of Restricted Content",
                    "type": "prevent_public_restricted",
                    "desc": "Disallow public sharing or external collaborator access on Restricted documents.",
                    "config": {"allowed_internal_only": True},
                    "priority": 20,
                },
                {
                    "name": "Require Approval for Confidential / Restricted Documents",
                    "type": "require_approval_sensitive",
                    "desc": "Mandate compliance approval before sharing sensitive documents.",
                    "config": {"target_classifications": ["Confidential", "Restricted"]},
                    "priority": 30,
                },
                {
                    "name": "Elevated Permission Justification",
                    "type": "elevated_justification",
                    "desc": "Require an audit justification when granting edit or manage permissions.",
                    "config": {"levels": ["edit", "manage"]},
                    "priority": 40,
                },
            ]
            for p_def in defaults:
                pol = SecurityPolicy(
                    organization_id=organization_id,
                    name=p_def["name"],
                    policy_type=p_def["type"],
                    description=p_def["desc"],
                    config_json=json.dumps(p_def["config"]),
                    is_enabled=True,
                    priority=p_def["priority"],
                )
                db.session.add(pol)
            db.session.commit()
            policies = (
                SecurityPolicy.query.filter_by(organization_id=organization_id)
                .order_by(SecurityPolicy.priority.asc(), SecurityPolicy.created_at.desc())
                .all()
            )
        return [p.to_dict() for p in policies]

    @staticmethod
    def get_execution_logs(organization_id: str, limit: int = 50) -> list:
        logs = (
            PolicyExecutionLog.query.filter_by(organization_id=organization_id)
            .order_by(PolicyExecutionLog.executed_at.desc())
            .limit(limit)
            .all()
        )
        return [l.to_dict() for l in logs]

    @staticmethod
    def create_policy(organization_id: str, data: dict, actor: User) -> dict:
        policy = SecurityPolicy(
            organization_id=organization_id,
            name=data.get("name", "Custom Guardrail Policy"),
            policy_type=data.get("policy_type"),
            description=data.get("description"),
            config_json=data.get("config_json") or "{}",
            is_enabled=data.get("is_enabled", True),
            priority=data.get("priority", 100),
        )
        if "config" in data:
            policy.config = data["config"]

        db.session.add(policy)
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="policy.create",
            resource_type="security_policy",
            resource_id=policy.id,
            outcome="success",
            metadata={"name": policy.name, "type": policy.policy_type},
        )
        return policy.to_dict()

    @staticmethod
    def toggle_policy(policy_id: str, organization_id: str, is_enabled: bool, actor: User) -> dict:
        policy = SecurityPolicy.query.filter_by(id=policy_id, organization_id=organization_id).first()
        if not policy:
            raise APIError("Policy not found.", status_code=404)

        policy.is_enabled = is_enabled
        policy.updated_at = datetime.utcnow()
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="policy.toggle",
            resource_type="security_policy",
            resource_id=policy.id,
            outcome="success",
            metadata={"is_enabled": is_enabled, "policy_name": policy.name},
        )
        return policy.to_dict()

    @staticmethod
    def evaluate_sharing_action(
        document: Document,
        recipient_email: str,
        permission_level: str,
        expires_at: datetime,
        justification: str,
        actor: User,
    ) -> dict:
        """
        Evaluates policies prior to creating or updating a document share grant.
        Returns {'decision': 'allow' | 'deny' | 'require_approval' | 'require_justification', 'reason': str}
        """
        org_id = document.organization_id
        classification = getattr(document, "classification", "Internal") or "Internal"

        policies = (
            SecurityPolicy.query.filter_by(organization_id=org_id, is_enabled=True)
            .order_by(SecurityPolicy.priority.asc())
            .all()
        )

        for pol in policies:
            # 1. Prevent Public/Anonymous Sharing of Restricted Documents
            if pol.policy_type == SecurityPolicy.TYPE_PREVENT_PUBLIC_RESTRICTED:
                if classification == "Restricted":
                    # External or non-authenticated recipient
                    recipient_user = User.query.filter_by(email=recipient_email).first()
                    if not recipient_user:
                        PolicyService._log_decision(pol, "share.create", "deny", "Restricted document cannot be shared with external/unregistered recipients.", document.id, actor)
                        raise APIError("Policy Enforcement: Documents classified as Restricted cannot be shared with external email addresses.", status_code=403)

            # 2. Elevated Justification requirement
            if pol.policy_type == SecurityPolicy.TYPE_ELEVATED_JUSTIFICATION:
                if permission_level in ["edit", "manage"]:
                    if not justification or len(justification.strip()) < 5:
                        PolicyService._log_decision(pol, "share.create", "require_justification", "Elevated permission requires business justification.", document.id, actor)
                        raise APIError("Policy Enforcement: Granting elevated ('edit' or 'manage') access requires a documented business justification.", status_code=400)

            # 3. Auto-expire External Grants
            if pol.policy_type == SecurityPolicy.TYPE_AUTO_EXPIRE_EXTERNAL:
                recipient_user = User.query.filter_by(email=recipient_email).first()
                if not recipient_user:
                    cfg = pol.config
                    max_days = cfg.get("default_expiration_days", 7)
                    max_allowed_expiry = datetime.utcnow() + timedelta(days=max_days + 1)
                    if not expires_at or expires_at > max_allowed_expiry:
                        PolicyService._log_decision(pol, "share.create", "deny", f"External share exceeds maximum retention window of {max_days} days.", document.id, actor)
                        raise APIError(f"Policy Enforcement: External collaborator grants must have an expiration date within {max_days} days.", status_code=400)

        return {"decision": "allow", "reason": "All active compliance guardrails satisfied."}

    @staticmethod
    def simulate(organization_id: str, context: dict, actor: User) -> dict:
        action = context.get("action", "share_external")
        classification = context.get("document_classification", "Internal")
        is_external = context.get("is_external", False)
        permission_level = context.get("permission_level", "view")

        policies = (
            SecurityPolicy.query.filter_by(organization_id=organization_id, is_enabled=True)
            .order_by(SecurityPolicy.priority.asc())
            .all()
        )

        for pol in policies:
            if pol.policy_type == SecurityPolicy.TYPE_PREVENT_PUBLIC_RESTRICTED:
                if classification == "Restricted" and (is_external or action == "share_external"):
                    return {
                        "decision": "deny",
                        "reason": "Restricted document cannot be shared with external/unregistered recipients.",
                        "policy_name": pol.name,
                        "policy_id": pol.id,
                    }
            if pol.policy_type == SecurityPolicy.TYPE_REQUIRE_APPROVAL_SENSITIVE:
                if classification in ["Confidential", "Restricted"]:
                    return {
                        "decision": "require_approval",
                        "reason": f"Sharing {classification} document requires formal approval workflow.",
                        "policy_name": pol.name,
                        "policy_id": pol.id,
                    }
            if pol.policy_type == SecurityPolicy.TYPE_ELEVATED_JUSTIFICATION:
                if permission_level in ["edit", "manage"]:
                    return {
                        "decision": "require_justification",
                        "reason": "Elevated permission requires business justification.",
                        "policy_name": pol.name,
                        "policy_id": pol.id,
                    }

        return {
            "decision": "allow",
            "reason": "Simulated action adheres to all active workspace security policies.",
            "policy_name": "Default Allow",
            "policy_id": None,
        }

    @staticmethod
    def evaluate_upload_quota(organization_id: str, new_file_bytes: int, actor: User):
        """Validates upload against workspace quota."""
        quota = TenantQuota.query.filter_by(organization_id=organization_id).first()
        if not quota:
            return

        # Check maximum individual file size
        if new_file_bytes > quota.max_upload_size_bytes:
            max_mb = quota.max_upload_size_bytes // (1024 * 1024)
            raise APIError(f"Policy Enforcement: File size exceeds the workspace maximum limit of {max_mb} MB.", status_code=413)

        # Check total storage limit
        total_bytes = db.session.query(db.func.sum(Document.size_bytes)).filter(
            Document.organization_id == organization_id, Document.status == "active"
        ).scalar() or 0

        if (total_bytes + new_file_bytes) > quota.max_storage_bytes:
            max_gb = quota.max_storage_bytes / (1024 * 1024 * 1024)
            raise APIError(f"Policy Enforcement: Workspace storage quota ({max_gb:.1f} GB) exceeded. Purge trash or request quota increase.", status_code=403)

    @staticmethod
    def run_maintenance(organization_id: str) -> dict:
        """Idempotent scheduled maintenance cleaner for expiring grants."""
        now = datetime.utcnow()
        expired_perms = DocumentPermission.query.join(Document).filter(
            Document.organization_id == organization_id,
            DocumentPermission.revoked_at == None,
            DocumentPermission.expires_at != None,
            DocumentPermission.expires_at < now,
        ).all()

        revoked_count = 0
        for p in expired_perms:
            p.revoked_at = now
            revoked_count += 1

        db.session.commit()
        return {
            "revoked_count": revoked_count,
            "expired_grants_revoked": revoked_count,
            "timestamp": now.isoformat(),
            "message": f"Evaluated and marked {revoked_count} expired access grants as revoked.",
        }

    @staticmethod
    def _log_decision(policy, action, decision, reason, target_id, actor):
        try:
            log = PolicyExecutionLog(
                organization_id=policy.organization_id,
                policy_id=policy.id,
                action=action,
                decision=decision,
                reason=reason,
                target_type="document",
                target_id=target_id,
                actor_id=actor.id if actor else None,
                executed_at=datetime.utcnow(),
            )
            db.session.add(log)
            db.session.commit()
        except:
            db.session.rollback()
