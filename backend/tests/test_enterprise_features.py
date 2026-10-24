import io
import json
import pytest
from app.models import (
    Document,
    ApprovalWorkflowTemplate,
    ApprovalWorkflowInstance,
    SecurityPolicy,
    TenantQuota,
    FeatureFlag,
)
from app.extensions import db


def login(client, email, password):
    client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_document_classification_and_history(client, test_setup):
    """Test setting classification, enforcing permissions, and auditing transitions."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # Upload document (default classification is 'Internal')
    upload_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Enterprise Classification Policy Data"), "classified.txt")},
        content_type="multipart/form-data",
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.get_json()["id"]

    # Check classification endpoint
    class_res = client.get(f"/api/v1/documents/{doc_id}/classification")
    assert class_res.status_code == 200
    assert class_res.get_json()["classification"] == "Internal"

    # Upgrade to Confidential
    patch_res = client.patch(
        f"/api/v1/documents/{doc_id}/classification",
        json={"classification": "Confidential", "reason": "Contains sensitive internal metrics"},
    )
    assert patch_res.status_code == 200
    assert patch_res.get_json()["classification"] == "Confidential"

    # Upgrade to Restricted
    patch_res2 = client.patch(
        f"/api/v1/documents/{doc_id}/classification",
        json={"classification": "Restricted", "reason": "Board only"},
    )
    assert patch_res2.status_code == 200
    assert patch_res2.get_json()["classification"] == "Restricted"

    # Downgrade to Internal requires reason
    fail_downgrade = client.patch(
        f"/api/v1/documents/{doc_id}/classification",
        json={"classification": "Internal"},
    )
    assert fail_downgrade.status_code == 400

    success_downgrade = client.patch(
        f"/api/v1/documents/{doc_id}/classification",
        json={"classification": "Internal", "reason": "Declassified after quarterly earnings call"},
    )
    assert success_downgrade.status_code == 200

    # Verify history
    hist_res = client.get(f"/api/v1/documents/{doc_id}/classification/history")
    assert hist_res.status_code == 200
    history = hist_res.get_json()["history"]
    assert len(history) >= 3


def test_approval_workflow_and_separation_of_duties(client, test_setup):
    """Test approval workflow template, submission, separation of duties, and approval."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # Upload a document
    doc_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Enterprise Contract 2026"), "contract.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = doc_res.get_json()["id"]

    # Create workflow template
    tpl_res = client.post(
        "/api/v1/approvals/templates",
        json={
            "name": "Standard Legal Review",
            "enforce_separation_of_duties": True,
            "required_approvals": 1,
            "steps": [{"name": "Legal Review", "role": "member"}],
        },
    )
    assert tpl_res.status_code == 201
    tpl_id = tpl_res.get_json()["template"]["id"]

    # Submit document for approval by Alice (Admin)
    submit_res = client.post(
        "/api/v1/approvals/submit",
        json={"document_id": doc_id, "template_id": tpl_id},
    )
    assert submit_res.status_code == 201
    workflow_id = submit_res.get_json()["workflow"]["id"]
    assert submit_res.get_json()["workflow"]["status"] == "in_review"

    # Separation of duties: Alice (submitter) CANNOT approve her own submission!
    self_approve_res = client.post(
        f"/api/v1/approvals/{workflow_id}/decide",
        json={"decision": "approved", "comment": "I approve my own doc"},
    )
    assert self_approve_res.status_code == 403
    assert "Separation of duties" in self_approve_res.get_json()["error"]["message"]

    # Log in as Bob (Member) to approve
    login(client, test_setup["member_email"], test_setup["password"])
    bob_approve_res = client.post(
        f"/api/v1/approvals/{workflow_id}/decide",
        json={"decision": "approved", "comment": "Legal review complete and compliant."},
    )
    assert bob_approve_res.status_code == 200
    assert bob_approve_res.get_json()["workflow"]["status"] == "approved"

    # Idempotent decision: duplicate decision returns 200 with notice
    duplicate_res = client.post(
        f"/api/v1/approvals/{workflow_id}/decide",
        json={"decision": "approved", "comment": "Trying again"},
    )
    assert duplicate_res.status_code == 200


def test_policy_automation_and_execution(client, test_setup):
    """Test policy creation, listing, simulation, and background maintenance."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # List policies (auto-seeded defaults)
    policies_res = client.get("/api/v1/policies")
    assert policies_res.status_code == 200
    policies = policies_res.get_json()["policies"]
    assert len(policies) > 0

    # Simulate policy
    sim_res = client.post(
        "/api/v1/policies/simulate",
        json={
            "action": "share_external",
            "document_classification": "Restricted",
            "is_external": True,
        },
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.get_json()
    assert sim_data["decision"] == "deny"
    assert "policy_name" in sim_data

    # Run maintenance cleaner
    cleaner_res = client.post("/api/v1/policies/run-maintenance")
    assert cleaner_res.status_code == 200
    assert "expired_grants_revoked" in cleaner_res.get_json()


def test_compliance_evidence_center(client, test_setup):
    """Test verifiable evidence package generation with deterministic SHA-256 manifest."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # Generate evidence package
    gen_res = client.post(
        "/api/v1/evidence/generate",
        json={
            "name": "Q4 Enterprise Security Audit Package",
            "categories": ["audit_trail", "permissions", "policies", "approvals"],
        },
    )
    assert gen_res.status_code == 201
    pkg = gen_res.get_json()
    pkg_id = pkg["id"]
    assert pkg["sha256_manifest_hash"] is not None

    # Retrieve package detail
    detail_res = client.get(f"/api/v1/evidence/{pkg_id}")
    assert detail_res.status_code == 200
    assert detail_res.get_json()["package"]["sha256_manifest_hash"] == pkg["sha256_manifest_hash"]

    # Download package JSON
    download_res = client.get(f"/api/v1/evidence/{pkg_id}/download")
    assert download_res.status_code == 200
    data = json.loads(download_res.data)
    assert data["name"] == "Q4 Enterprise Security Audit Package"
    assert data["manifest"]["package_id"] == pkg_id
    assert "artifacts" in data["manifest"]


def test_access_explorer_graph_and_effective_permissions(client, test_setup):
    """Test visual Access Explorer graph endpoint and effective permissions calculation."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # Upload document
    res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Confidential Executive Briefing"), "briefing.docx")},
        content_type="multipart/form-data",
    )
    doc_id = res.get_json()["id"]

    # Query access explorer graph
    graph_res = client.get(f"/api/v1/access-explorer/graph?document_id={doc_id}")
    assert graph_res.status_code == 200
    graph = graph_res.get_json()
    assert "nodes" in graph
    assert "links" in graph
    assert any(n["id"] == f"doc:{doc_id}" for n in graph["nodes"])

    # Query effective permissions
    perms_res = client.get(f"/api/v1/access-explorer/effective-permissions?document_id={doc_id}")
    assert perms_res.status_code == 200
    perms = perms_res.get_json()["records"]
    assert len(perms) >= 1
    # Alice (Admin) should have 'manage' effective permission
    alice_perm = next((p for p in perms if p["email"] == test_setup["admin_email"]), None)
    assert alice_perm is not None
    assert alice_perm["effective_permission"] == "manage"


def test_enterprise_integrations_and_quotas(client, test_setup):
    """Test OIDC configuration, SCIM 2.0 user provisioning, quotas, and feature flags."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # 1. OIDC Configuration
    oidc_get = client.get("/api/v1/integrations/oidc")
    assert oidc_get.status_code == 200

    oidc_post = client.post(
        "/api/v1/integrations/oidc",
        json={
            "provider_name": "Okta Enterprise",
            "issuer_url": "https://dev-trustvault.okta.com",
            "client_id": "0oa123456789trustvault",
            "client_secret": "secret12345",
            "is_enabled": True,
        },
    )
    assert oidc_post.status_code == 200
    assert oidc_post.get_json()["oidc"]["issuer_url"] == "https://dev-trustvault.okta.com"

    # 2. SCIM 2.0 User Provisioning
    scim_get = client.get("/api/v1/scim/v2/Users")
    assert scim_get.status_code == 200
    scim_users = scim_get.get_json()
    assert scim_users["totalResults"] >= 2

    # 3. Tenant Quotas
    quota_get = client.get("/api/v1/quotas")
    assert quota_get.status_code == 200
    assert "max_storage_bytes" in quota_get.get_json()

    # 4. Feature Flags
    flags_get = client.get("/api/v1/feature-flags")
    assert flags_get.status_code == 200
    flags = flags_get.get_json()["flags"]
    assert len(flags) > 0

    # 5. Disaster Recovery Backup
    dr_res = client.post("/api/v1/disaster-recovery/backup")
    assert dr_res.status_code == 201
    assert "backup_sha256" in dr_res.get_json()
