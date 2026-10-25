import io
import time
import hmac
import hashlib
from datetime import datetime, timedelta
from app.extensions import db
from app.models import Document, DocumentPermission, User, OrganizationMembership, SavedSearch


def login(client, email, password):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_dangerous_file_extensions_blocked(client, test_setup):
    """CWE-434: Dangerous executable/script file uploads are rejected with 400."""
    login(client, test_setup["admin_email"], test_setup["password"])

    for dangerous_filename in ["malware.exe", "script.sh", "backdoor.php", "payload.bat", "run.ps1"]:
        res = client.post(
            "/api/v1/documents",
            data={"file": (io.BytesIO(b"evil code"), dangerous_filename)},
            content_type="multipart/form-data",
        )
        assert res.status_code == 400, f"Expected 400 for {dangerous_filename}, got {res.status_code}"
        assert "dangerous" in res.get_json()["error"]["message"].lower() or "prohibited" in res.get_json()["error"]["message"].lower()


def test_version_dangerous_file_extensions_blocked(client, test_setup):
    """CWE-434: Dangerous executable uploads are blocked during document version creation."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # 1. Upload valid document
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Valid initial version"), "document.pdf")},
        content_type="multipart/form-data",
    )
    assert up.status_code == 201
    doc_id = up.get_json()["id"]

    # 2. Attempt to upload dangerous executable as new version
    ver_res = client.post(
        f"/api/v1/documents/{doc_id}/versions",
        data={"file": (io.BytesIO(b"malicious version payload"), "exploit.exe")},
        content_type="multipart/form-data",
    )
    assert ver_res.status_code == 400
    assert "dangerous" in ver_res.get_json()["error"]["message"].lower() or "prohibited" in ver_res.get_json()["error"]["message"].lower()


def test_global_search_non_admin_no_crash(client, test_setup):
    """Search: Non-admin search uses recipient_user_id and active permissions without crashing."""
    # Admin uploads doc1
    login(client, test_setup["admin_email"], test_setup["password"])
    up1 = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Admin Confidential Financials"), "admin_report.pdf")},
        content_type="multipart/form-data",
    )
    doc1_id = up1.get_json()["id"]
    client.post("/api/v1/auth/logout")

    # Member uploads doc2
    login(client, test_setup["member_email"], test_setup["password"])
    up2 = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Member Project Planning"), "member_plan.pdf")},
        content_type="multipart/form-data",
    )
    assert up2.status_code == 201
    doc2_id = up2.get_json()["id"]

    # Member performs search: before the fix, this crashed with AttributeError on grantee_user_id!
    search_res = client.get("/api/v1/search?q=pdf")
    assert search_res.status_code == 200
    data = search_res.get_json()
    assert "documents" in data
    found_ids = [d["id"] for d in data["documents"]]
    assert doc2_id in found_ids
    assert doc1_id not in found_ids  # Admin doc not shared with member


def test_duplicate_detection_idor_prevented(client, test_setup):
    """IDOR: Non-admin member cannot search duplicates of a document they have no access to."""
    # Admin uploads private doc
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Secret Vault Asset"), "secret.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = up.get_json()["id"]
    client.post("/api/v1/auth/logout")

    # Member tries to query duplicates for admin's private doc
    login(client, test_setup["member_email"], test_setup["password"])
    dup_res = client.get(f"/api/v1/governance/documents/{doc_id}/duplicates")
    assert dup_res.status_code == 403


def test_access_explorer_idor_prevented(client, test_setup):
    """IDOR: Member cannot inspect access graph of another user's document without permission."""
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Private Executive Board Deck"), "board.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = up.get_json()["id"]
    client.post("/api/v1/auth/logout")

    # Member attempts to view access graph
    login(client, test_setup["member_email"], test_setup["password"])
    graph_res = client.get(f"/api/v1/access-explorer/graph?document_id={doc_id}")
    assert graph_res.status_code == 403


def test_classification_idor_prevented(client, test_setup):
    """IDOR: Member cannot modify or downgrade classification of another user's document."""
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Restricted IP"), "intellectual_property.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = up.get_json()["id"]

    # Admin sets to Restricted
    patch_res = client.patch(
        f"/api/v1/documents/{doc_id}/classification",
        json={"classification": "Restricted"},
    )
    assert patch_res.status_code == 200
    client.post("/api/v1/auth/logout")

    # Member tries to downgrade classification
    login(client, test_setup["member_email"], test_setup["password"])
    unauth_patch = client.patch(
        f"/api/v1/documents/{doc_id}/classification",
        json={"classification": "Public", "reason": "unauthorized downgrade attempt"},
    )
    assert unauth_patch.status_code == 403

    # Member tries to view classification history
    history_res = client.get(f"/api/v1/documents/{doc_id}/classification/history")
    assert history_res.status_code == 403


def test_approval_idor_prevented(client, test_setup):
    """IDOR: Member cannot submit someone else's document or cancel someone else's workflow."""
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Review material"), "budget.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = up.get_json()["id"]

    # Admin submits for approval
    submit_res = client.post("/api/v1/approvals/submit", json={"document_id": doc_id, "notes": "Q1 budget"})
    assert submit_res.status_code == 201
    workflow_id = submit_res.get_json()["id"]
    client.post("/api/v1/auth/logout")

    # Member tries to cancel admin's workflow
    login(client, test_setup["member_email"], test_setup["password"])
    cancel_res = client.post(f"/api/v1/approvals/{workflow_id}/cancel")
    assert cancel_res.status_code == 403


def test_signed_url_generation_and_verification(client, test_setup):
    """Signed URLs: Download permissions enforced on creation; valid signature allows direct download."""
    # 1. Admin uploads document
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Confidential Signed URL Test Content"), "signed_test.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = up.get_json()["id"]

    # 2. Admin generates signed download URL
    signed_res = client.post(f"/api/v1/documents/{doc_id}/signed-url", json={"expires_in_seconds": 300})
    assert signed_res.status_code == 200
    signed_url = signed_res.get_json()["signed_url"]
    client.post("/api/v1/auth/logout")

    # 3. Direct unauthenticated download via valid signed URL succeeds
    dl_res = client.get(signed_url)
    assert dl_res.status_code == 200
    assert dl_res.data == b"Confidential Signed URL Test Content"

    # 4. Tampered signature fails with 401
    tampered_url = signed_url.replace("sig=", "sig=invalid_tampered_signature_")
    tampered_res = client.get(tampered_url)
    assert tampered_res.status_code == 401


def test_api_key_authentication(client, test_setup):
    """Developer API Keys: Bearer tv_live_... keys successfully authenticate API endpoints."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # Create an API key
    key_res = client.post(
        "/api/v1/developer/api-keys",
        json={"name": "CI Bot Key", "scopes": ["documents:read"]},
    )
    assert key_res.status_code == 201
    raw_key = key_res.get_json()["raw_secret_key"]
    client.post("/api/v1/auth/logout")

    # Call /api/v1/documents using Bearer key
    headers = {"Authorization": f"Bearer {raw_key}"}
    api_res = client.get("/api/v1/documents", headers=headers)
    assert api_res.status_code == 200
    assert "documents" in api_res.get_json()


def test_access_review_revocation_workflow(client, test_setup):
    """Access Reviews: Revoking permission in access review successfully revokes the grant."""
    login(client, test_setup["admin_email"], test_setup["password"])

    # Upload and grant
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Quarterly Report"), "quarterly.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = up.get_json()["id"]

    grant_res = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": test_setup["member_id"], "permission_level": "download"},
    )
    assert grant_res.status_code == 201

    # Create review campaign
    camp_res = client.post(
        "/api/v1/governance/access-reviews",
        json={"title": "Q1 Audit Review", "days_valid": 7},
    )
    assert camp_res.status_code == 201
    camp_id = camp_res.get_json()["id"]

    # Get items
    items_res = client.get(f"/api/v1/governance/access-reviews/{camp_id}/items")
    assert items_res.status_code == 200
    items = items_res.get_json()["items"]
    assert len(items) > 0
    item_id = items[0]["id"]

    # Revoke grant through access review decision
    decide_res = client.post(
        f"/api/v1/governance/access-reviews/{camp_id}/items/{item_id}/decision",
        json={"decision": "revoked", "notes": "Access no longer required for role"},
    )
    assert decide_res.status_code == 200
    assert decide_res.get_json()["decision"] == "revoked"

    # Verify that the underlying permission was revoked
    client.post("/api/v1/auth/logout")
    login(client, test_setup["member_email"], test_setup["password"])
    dl_attempt = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_attempt.status_code == 403


def test_evidence_package_categories_populated(client, test_setup):
    """Compliance Evidence: Generates manifest and artifacts with frontend category names."""
    login(client, test_setup["admin_email"], test_setup["password"])

    gen_res = client.post(
        "/api/v1/evidence/generate",
        json={
            "name": "Full SOX Audit Bundle",
            "categories": ["audit_trail", "permissions", "policies", "integrity", "approvals"],
        },
    )
    assert gen_res.status_code == 201
    data = gen_res.get_json()
    assert data["status"] == "ready"
    assert "download_content" in data
    artifacts = data["download_content"]["artifacts"]
    assert "audit_trail.json" in artifacts
    assert "permissions_matrix.json" in artifacts
    assert "policies_and_executions.json" in artifacts
    assert "cryptographic_integrity_manifest.json" in artifacts


def test_account_deletion_with_foreign_keys_safe(client, test_setup):
    """Account Deletion: Safely handles users who own documents without database crash."""
    login(client, test_setup["member_email"], test_setup["password"])

    # Member uploads document (creates foreign key Document.owner_id)
    client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"My personal file"), "personal.txt")},
        content_type="multipart/form-data",
    )

    # Member deletes account
    del_res = client.delete("/api/v1/auth/account")
    assert del_res.status_code == 200
    assert "deleted" in del_res.get_json()["message"].lower()

    # Verify session terminated
    check_res = client.get("/api/v1/auth/me")
    assert check_res.status_code == 401
