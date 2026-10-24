import json
import hashlib
from datetime import datetime
from ..extensions import db
from ..models import (
    EvidencePackage,
    AuditLog,
    DocumentPermission,
    SecurityPolicy,
    PolicyExecutionLog,
    ApprovalWorkflowInstance,
    Document,
    User,
)
from ..errors.handlers import APIError
from .audit_service import AuditService


class EvidenceService:
    """Produces verifiable compliance evidence packages with deterministic SHA-256 manifests."""

    @staticmethod
    def list_packages(organization_id: str) -> list:
        packages = (
            EvidencePackage.query.filter_by(organization_id=organization_id)
            .order_by(EvidencePackage.created_at.desc())
            .all()
        )
        return [p.to_dict() for p in packages]

    @staticmethod
    def generate_package(
        organization_id: str,
        name: str,
        categories: list,
        actor: User,
        date_from: datetime = None,
        date_to: datetime = None,
    ) -> dict:
        if not categories:
            categories = ["audit_events", "permissions_history", "policy_configs", "approvals"]

        package_id = f"ev_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        package_name = name.strip() if name else f"Compliance_Audit_Export_{datetime.utcnow().strftime('%Y-%m-%d')}"

        artifacts = {}
        manifest_items = []

        # 1. Audit Trail Events
        if "audit_events" in categories:
            query = AuditLog.query.filter_by(organization_id=organization_id)
            if date_from:
                query = query.filter(AuditLog.created_at >= date_from)
            if date_to:
                query = query.filter(AuditLog.created_at <= date_to)
            events = query.order_by(AuditLog.sequence_number.asc()).all()
            data = [e.to_dict() for e in events]
            serialized = json.dumps(data, indent=2, sort_keys=True)
            digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
            artifacts["audit_trail.json"] = data
            manifest_items.append({
                "artifact": "audit_trail.json",
                "record_count": len(data),
                "sha256": digest,
                "category": "Audit Trail & Cryptographic Event Sequence",
            })

        # 2. Permissions & Sharing History
        if "permissions_history" in categories:
            perms = DocumentPermission.query.join(Document).filter(
                Document.organization_id == organization_id
            ).all()
            data = [p.to_dict() for p in perms]
            serialized = json.dumps(data, indent=2, sort_keys=True)
            digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
            artifacts["permissions_matrix.json"] = data
            manifest_items.append({
                "artifact": "permissions_matrix.json",
                "record_count": len(data),
                "sha256": digest,
                "category": "Access Grants, Expirations & Immediate Revocations",
            })

        # 3. Policy Configurations & Decisions
        if "policy_configs" in categories:
            policies = SecurityPolicy.query.filter_by(organization_id=organization_id).all()
            logs = PolicyExecutionLog.query.filter_by(organization_id=organization_id).all()
            data = {
                "policies": [p.to_dict() for p in policies],
                "execution_logs": [l.to_dict() for l in logs],
            }
            serialized = json.dumps(data, indent=2, sort_keys=True)
            digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
            artifacts["policies_and_executions.json"] = data
            manifest_items.append({
                "artifact": "policies_and_executions.json",
                "record_count": len(policies) + len(logs),
                "sha256": digest,
                "category": "Guardrail Policies and Decision Execution Logs",
            })

        # 4. Approval Workflows & Decisions
        if "approvals" in categories:
            approvals = ApprovalWorkflowInstance.query.filter_by(organization_id=organization_id).all()
            data = [a.to_dict() for a in approvals]
            serialized = json.dumps(data, indent=2, sort_keys=True)
            digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
            artifacts["approval_workflows.json"] = data
            manifest_items.append({
                "artifact": "approval_workflows.json",
                "record_count": len(data),
                "sha256": digest,
                "category": "Review Decisions and Version Hash Bindings",
            })

        # Construct Master Manifest
        manifest_payload = {
            "schema_version": "trustvault_evidence_v1",
            "package_id": package_id,
            "organization_id": organization_id,
            "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "generated_by": actor.email,
            "scope": {
                "date_from": date_from.isoformat() if date_from else "Epoch",
                "date_to": date_to.isoformat() if date_to else "Now",
            },
            "artifacts": manifest_items,
            "honesty_disclosure": (
                "This evidence manifest is computed deterministically from active database records. "
                "It proves internal integrity and provenance at the moment of package export."
            ),
        }

        manifest_serialized = json.dumps(manifest_payload, indent=2, sort_keys=True)
        manifest_hash = hashlib.sha256(manifest_serialized.encode("utf-8")).hexdigest()
        manifest_payload["manifest_sha256"] = manifest_hash

        package = EvidencePackage(
            id=package_id,
            organization_id=organization_id,
            name=package_name,
            requested_by_id=actor.id,
            date_from=date_from,
            date_to=date_to,
            categories_json=json.dumps(categories),
            manifest_json=json.dumps(manifest_payload),
            sha256_manifest_hash=manifest_hash,
            status="ready",
            created_at=datetime.utcnow(),
        )
        db.session.add(package)
        db.session.commit()

        AuditService.record(
            organization_id=organization_id,
            actor_user_id=actor.id,
            action="evidence.package_generated",
            resource_type="evidence_package",
            resource_id=package.id,
            outcome="success",
            metadata={
                "name": package_name,
                "manifest_hash": manifest_hash,
                "categories": categories,
            },
        )

        res = package.to_dict()
        res["download_content"] = {
            "manifest": manifest_payload,
            "artifacts": artifacts,
        }
        return res

    @staticmethod
    def get_package_download(package_id: str, organization_id: str) -> dict:
        package = EvidencePackage.query.filter_by(id=package_id, organization_id=organization_id).first()
        if not package:
            raise APIError("Evidence package not found.", status_code=404)
        return package.to_dict()
