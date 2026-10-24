import io
import pytest
from app.models import (
    Organization,
    User,
    OrganizationMembership,
    Document,
    DocumentVersion,
    AuditLog,
    SecurityAlert,
    ApiKey,
    WebhookSubscription,
)
from app.services.audit_service import AuditService
from app.services.version_service import VersionService
from app.services.document_service import DocumentService
from app.services.security_monitor_service import SecurityMonitorService
from app.services.developer_service import DeveloperService


@pytest.fixture
def test_env(client, app):
    with app.app_context():
        # Setup organization and admin
        org = Organization(name="Advanced Testing Org", slug="adv-test-org")
        from app.extensions import db
        db.session.add(org)
        db.session.commit()

        from app.security.hashing import hash_password
        admin = User(
            full_name="Admin Security",
            email="admin.sec@advtest.example",
            password_hash=hash_password("Password123!"),
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()

        membership = OrganizationMembership(
            organization_id=org.id,
            user_id=admin.id,
            role="admin",
            status="active",
        )
        db.session.add(membership)
        db.session.commit()

        return {"org_id": org.id, "admin_id": admin.id, "admin_email": admin.email}


def test_audit_hash_chain_verification_and_tamper_detection(client, test_env, app):
    with app.app_context():
        org_id = test_env["org_id"]
        admin_id = test_env["admin_id"]

        # Record 3 events
        e1 = AuditService.record(
            organization_id=org_id,
            actor_user_id=admin_id,
            action="document.upload",
            resource_type="document",
            resource_id="doc-1",
            outcome="success",
            metadata={"filename": "doc1.pdf"},
        )
        e2 = AuditService.record(
            organization_id=org_id,
            actor_user_id=admin_id,
            action="permission.grant",
            resource_type="permission",
            resource_id="perm-1",
            outcome="success",
            metadata={"recipient": "user2@test.com"},
        )
        e3 = AuditService.record(
            organization_id=org_id,
            actor_user_id=admin_id,
            action="document.download",
            resource_type="document",
            resource_id="doc-1",
            outcome="success",
        )

        assert e1.sequence_number == 1
        assert e2.sequence_number == 2
        assert e3.sequence_number == 3
        assert e2.prev_event_hash == e1.event_hash
        assert e3.prev_event_hash == e2.event_hash

        # Run verification on valid chain
        res = AuditService.verify_chain(org_id)
        assert res["chain_valid"] is True
        assert res["total_events"] == 3
        assert res["head_hash"] == e3.event_hash

        # Tamper test: alter e2 action in database
        from app.extensions import db
        e2.action = "tampered.action"
        db.session.commit()

        tampered_res = AuditService.verify_chain(org_id)
        assert tampered_res["chain_valid"] is False
        assert tampered_res["broken_sequence"] == 2
        assert "integrity violation" in tampered_res["error_message"].lower() or "tampered" in tampered_res["error_type"]


def test_document_versioning_and_restore(client, test_env, app):
    with app.app_context():
        from app.extensions import db
        org = db.session.get(Organization, test_env["org_id"])
        admin = db.session.get(User, test_env["admin_id"])

        # Upload initial document (v1)
        initial_file = (io.BytesIO(b"%PDF-1.4 Initial content"), "agreement.pdf")
        doc_data = DocumentService.upload_document(
            file_obj=type("File", (), {"filename": "agreement.pdf", "stream": io.BytesIO(b"%PDF-1.4 Initial content")})(),
            user=admin,
            organization=org,
        )

        doc_id = doc_data["id"]
        versions = VersionService.list_versions(doc_id, admin, org, is_admin=True)
        assert len(versions) == 1
        assert versions[0]["version_number"] == 1

        # Upload Version 2
        v2_file = type("File", (), {"filename": "agreement_v2.pdf", "stream": io.BytesIO(b"%PDF-1.4 Version 2 updated content")})()
        v2_data = VersionService.create_version(
            document_id=doc_id,
            file_obj=v2_file,
            actor=admin,
            organization=org,
            is_admin=True,
            change_summary="Updated pricing section",
        )
        assert v2_data["version_number"] == 2

        doc_refreshed = db.session.get(Document, doc_id)
        assert doc_refreshed.current_version_number == 2
        assert doc_refreshed.sha256_hash == v2_data["sha256_hash"]

        # Compare v1 and v2
        diff = VersionService.compare_versions(doc_id, versions[0]["id"], v2_data["id"], admin, org, is_admin=True)
        assert diff["hash_identical"] is False
        assert diff["size_delta_bytes"] != 0

        # Restore v1: Creates non-destructive Version 3
        v3_data = VersionService.restore_version(doc_id, versions[0]["id"], admin, org, is_admin=True)
        assert v3_data["version_number"] == 3
        assert v3_data["sha256_hash"] == versions[0]["sha256_hash"]

        all_versions = VersionService.list_versions(doc_id, admin, org, is_admin=True)
        assert len(all_versions) == 3


def test_trash_soft_delete_and_recovery(client, test_env, app):
    with app.app_context():
        from app.extensions import db
        org = db.session.get(Organization, test_env["org_id"])
        admin = db.session.get(User, test_env["admin_id"])

        doc_data = DocumentService.upload_document(
            file_obj=type("File", (), {"filename": "discardable.txt", "stream": io.BytesIO(b"Temporary notes")})(),
            user=admin,
            organization=org,
        )
        doc_id = doc_data["id"]

        # Soft delete to trash
        del_res = DocumentService.delete_document(doc_id, admin, org, is_admin=True)
        assert "removed" in del_res["message"].lower()

        doc_check = db.session.get(Document, doc_id)
        assert doc_check.status in ("deleted", "trash")

        # Verify listed in trash
        trash_list = DocumentService.list_trash(org.id, admin.id, is_admin=True)
        assert any(d["id"] == doc_id for d in trash_list["documents"])

        # Restore from trash
        restored = DocumentService.restore_document(doc_id, admin, org, is_admin=True)
        assert restored["status"] == "active"
        assert restored["deleted_at"] is None

        # Permanent purge
        purge_res = DocumentService.purge_document(doc_id, admin, org, is_admin=True)
        assert "purged" in purge_res["message"].lower()
        assert db.session.get(Document, doc_id) is None


def test_security_alert_evaluation_and_resolution(client, test_env, app):
    with app.app_context():
        from app.extensions import db
        org = db.session.get(Organization, test_env["org_id"])
        admin = db.session.get(User, test_env["admin_id"])

        # Simulate 3 denied access events
        for i in range(3):
            AuditService.record(
                organization_id=org.id,
                actor_user_id=admin.id,
                action="document.access_denied",
                resource_type="document",
                resource_id=f"forbidden-doc-{i}",
                outcome="denied",
            )

        # Trigger alert evaluation
        alerts = SecurityMonitorService.evaluate_and_sync_alerts(org.id)
        assert len(alerts) >= 1
        brute_alert = next((a for a in alerts if a["alert_type"] == "brute_force_access_denied"), None)
        assert brute_alert is not None
        assert brute_alert["status"] == "open"

        # Acknowledge alert
        ack = SecurityMonitorService.acknowledge_alert(brute_alert["id"], admin, org.id)
        assert ack["status"] == "acknowledged"

        # Resolve alert
        resolved = SecurityMonitorService.resolve_alert(brute_alert["id"], admin, org.id)
        assert resolved["status"] == "resolved"


def test_developer_api_keys_and_webhooks(client, test_env, app):
    with app.app_context():
        from app.extensions import db
        org = db.session.get(Organization, test_env["org_id"])
        admin = db.session.get(User, test_env["admin_id"])

        # Create API Key
        key_data = DeveloperService.create_api_key(
            name="CI Pipeline Token",
            scopes=["documents:read", "audit:read"],
            actor=admin,
            organization=org,
        )
        assert "raw_secret_key" in key_data
        assert key_data["raw_secret_key"].startswith("tv_live_")
        assert key_data["key_prefix"].startswith("tv_live_")

        # List API Keys
        keys = DeveloperService.list_api_keys(org.id)
        assert len(keys) == 1
        # Raw secret not in listed keys
        assert "raw_secret_key" not in keys[0]

        # Revoke API Key
        revoked = DeveloperService.revoke_api_key(key_data["id"], org.id, admin)
        assert "revoked" in revoked["message"].lower()

        # Webhooks
        wh_data = DeveloperService.create_webhook(
            target_url="https://webhook.example.com/events",
            events=["document.upload", "permission.grant"],
            organization=org,
            actor=admin,
        )
        assert "secret" in wh_data
        assert wh_data["target_url"] == "https://webhook.example.com/events"

        # Test Webhook dispatch
        test_res = DeveloperService.test_webhook(wh_data["id"], org.id, admin)
        assert "signature" in test_res
        assert test_res["signature"].startswith("sha256=")
        assert test_res["delivery"]["status_code"] == 200
