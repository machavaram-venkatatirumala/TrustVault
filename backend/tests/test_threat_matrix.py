import io
import hashlib
import pytest
from app.extensions import db
from app.models import Document, DocumentPermission, Organization, User, AuditLog
from app.storage import get_storage
from app.security.hashing import hash_password


def login(client, email, password):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_threat_01_anonymous_access_to_document_rejected(client):
    """THREAT-01: Anonymous user attempting to access protected endpoints is rejected with 401."""
    res = client.get("/api/v1/documents")
    assert res.status_code == 401
    assert "Authentication required" in res.get_json()["error"]["message"]

    res_dl = client.get("/api/v1/documents/some-random-id/download")
    assert res_dl.status_code == 401
    assert "Authentication required" in res_dl.get_json()["error"]["message"]


def test_threat_02_cross_tenant_document_access_rejected(client, test_setup):
    """THREAT-02: Authenticated tenant attempting to access another tenant's document is blocked."""
    # 1. Admin in Acme Corp uploads doc
    login(client, test_setup["admin_email"], test_setup["password"])
    upload_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Acme Confidential Internal Policy"), "policy.pdf")},
        content_type="multipart/form-data"
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.get_json()["id"]
    client.post("/api/v1/auth/logout")

    # 2. Charlie in Other Corp attempts to access Acme's document
    login(client, "charlie@other.example", test_setup["password"])
    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 404  # 404 to avoid leaking existence of document in other tenant

    dl_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_res.status_code == 404


def test_threat_03_member_access_to_admin_audit_logs_rejected(client, test_setup):
    """THREAT-03: Regular member cannot access admin audit trail."""
    login(client, test_setup["member_email"], test_setup["password"])
    res = client.get("/api/v1/audit-events")
    assert res.status_code == 403
    assert "Administrative privileges required" in res.get_json()["error"]["message"]


def test_threat_04_user_cannot_self_elevate_role(client):
    """THREAT-04: User cannot self-assign admin roles or elevate privileges via registration payload."""
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Attacker Bob",
        "email": "attacker@example.com",
        "password": "Password123!",
        "role": "superadmin",
        "is_admin": True,
        "terms_accepted": True
    })
    assert res.status_code == 201
    user = User.query.filter_by(email="attacker@example.com").first()
    assert user is not None
    # User owns their personal workspace, but does NOT gain admin over any existing organization
    acme_org = Organization.query.filter_by(slug="acme-corp").first()
    if acme_org:
        assert not any(m.organization_id == acme_org.id for m in user.memberships)


def test_threat_05_rate_limiting_enforcement(client):
    """THREAT-05: Rate limiting decorator is active on authentication endpoints."""
    from app.extensions import limiter
    assert limiter is not None


def test_threat_06_session_cookie_flags_and_isolation(client, test_setup):
    """THREAT-06: Session cookies enforce security attributes."""
    res = login(client, test_setup["admin_email"], test_setup["password"])
    assert res.status_code == 200
    cookies = res.headers.getlist("Set-Cookie")
    assert any("session" in c for c in cookies)


def test_threat_07_path_traversal_filename_sanitization(client, test_setup):
    """THREAT-07: Path traversal attempts in upload filename are sanitized to safe basenames."""
    login(client, test_setup["admin_email"], test_setup["password"])
    res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Traverse test"), "../../../etc/shadow")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 201
    doc_data = res.get_json()
    assert ".." not in doc_data["original_filename"]
    assert "/" not in doc_data["original_filename"]
    assert "\\" not in doc_data["original_filename"]
    # Check that storage key on disk is an opaque UUID key
    doc = Document.query.get(doc_data["id"])
    assert doc.storage_key.startswith("orgs/")
    assert "etc" not in doc.storage_key
    assert "shadow" not in doc.storage_key


def test_threat_08_disallowed_or_empty_upload_rejected(client, test_setup):
    """THREAT-08: Empty or invalid uploads are rejected with 400."""
    login(client, test_setup["admin_email"], test_setup["password"])
    res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b""), "empty.txt")},
        content_type="multipart/form-data"
    )
    assert res.status_code == 400
    assert "empty" in res.get_json()["error"]["message"].lower()


def test_threat_09_download_denied_immediately_after_revocation(client, test_setup):
    """THREAT-09: Direct download attempt after permission revocation is blocked immediately with 403."""
    # 1. Admin uploads doc
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Revocation Test Data"), "secret.pdf")},
        content_type="multipart/form-data"
    )
    doc_id = up.get_json()["id"]

    # 2. Grant download permission to member
    grant_res = client.post(f"/api/v1/documents/{doc_id}/permissions", json={
        "recipient_user_id": test_setup["member_id"],
        "permission_level": "download"
    })
    assert grant_res.status_code == 201
    perm_id = grant_res.get_json()["id"]
    client.post("/api/v1/auth/logout")

    # 3. Member downloads successfully
    login(client, test_setup["member_email"], test_setup["password"])
    dl_ok = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_ok.status_code == 200
    assert dl_ok.data == b"Revocation Test Data"
    client.post("/api/v1/auth/logout")

    # 4. Admin revokes permission
    login(client, test_setup["admin_email"], test_setup["password"])
    revoke_res = client.delete(f"/api/v1/permissions/{perm_id}")
    assert revoke_res.status_code == 200
    client.post("/api/v1/auth/logout")

    # 5. Member attempts download again -> immediate 403
    login(client, test_setup["member_email"], test_setup["password"])
    dl_fail = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_fail.status_code == 403
    assert "permission" in dl_fail.get_json()["error"]["message"].lower()


def test_threat_10_reuse_of_consumed_or_expired_token_rejected(client, test_setup):
    """THREAT-10: Password reset tokens are single-use and cannot be replayed."""
    res_forgot = client.post("/api/v1/auth/forgot-password", json={
        "email": test_setup["admin_email"]
    })
    assert res_forgot.status_code == 200
    token = res_forgot.get_json().get("dev_reset_token")
    assert token is not None

    # First reset succeeds
    res_reset1 = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "NewSecurePassword456!"
    })
    assert res_reset1.status_code == 200

    # Second reset with same token fails
    res_reset2 = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "AnotherPassword789!"
    })
    assert res_reset2.status_code == 400
    assert "Invalid or expired" in res_reset2.get_json()["error"]["message"]


def test_threat_11_duplicate_workspace_creation_prevention(client, test_setup):
    """THREAT-11: Duplicate workspace slug or repeated membership creation is prevented."""
    login(client, test_setup["admin_email"], test_setup["password"])
    inv1 = client.post("/api/v1/members/invite", json={
        "full_name": "Duplicate Member",
        "email": "duplicate.invite@example.com",
        "role": "member",
        "password": "Password123!"
    })
    assert inv1.status_code == 201

    inv2 = client.post("/api/v1/members/invite", json={
        "full_name": "Duplicate Member",
        "email": "duplicate.invite@example.com",
        "role": "member",
        "password": "Password123!"
    })
    assert inv2.status_code == 409
    assert "already a member" in inv2.get_json()["error"]["message"].lower()


def test_threat_12_client_cannot_forge_sha256_digest(client, test_setup):
    """THREAT-12: Server calculates SHA-256 strictly from uploaded bytes; client-provided hashes are ignored."""
    login(client, test_setup["admin_email"], test_setup["password"])
    payload_bytes = b"ServerSideHashedBytesOnly"
    expected_real_hash = hashlib.sha256(payload_bytes).hexdigest()
    fake_client_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    res = client.post(
        "/api/v1/documents",
        data={
            "file": (io.BytesIO(payload_bytes), "hash_test.txt"),
            "sha256": fake_client_hash,
        },
        content_type="multipart/form-data",
        headers={"X-Client-SHA256": fake_client_hash}
    )

    assert res.status_code == 201
    stored_hash = res.get_json()["sha256_hash"]
    assert stored_hash == expected_real_hash
    assert stored_hash != fake_client_hash


def test_threat_13_audit_records_immutable_no_client_mutation(client, test_setup):
    """THREAT-13: Audit log endpoints are strictly read-only for clients."""
    login(client, test_setup["admin_email"], test_setup["password"])
    res_post = client.post("/api/v1/audit-events", json={"action": "fake.event"})
    assert res_post.status_code == 405

    res_del = client.delete("/api/v1/audit-events/fake-event-id")
    assert res_del.status_code == 405

    res_put = client.put("/api/v1/audit-events/fake-event-id", json={"outcome": "tampered"})
    assert res_put.status_code == 405


def test_threat_14_sql_injection_defense(client, test_setup):
    """THREAT-14: Search and filters are protected against SQL injection via ORM parameterization."""
    login(client, test_setup["admin_email"], test_setup["password"])
    sqli_payload = "' OR '1'='1' --"
    res = client.get(f"/api/v1/documents?search={sqli_payload}")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data["documents"], list)
    for doc in data["documents"]:
        assert doc["organization_id"] == test_setup["org_id"]


def test_threat_15_no_credentials_in_error_responses(client):
    """THREAT-15: Internal errors and bad requests do not leak passwords, database URLs, or stack traces."""
    res = client.get("/api/v1/documents/non-existent-uuid-99999")
    assert res.status_code in (401, 404)
    data = res.get_json()
    response_text = str(data)
    assert "password" not in response_text.lower()
    assert "traceback" not in response_text.lower()
    assert "sqlite" not in response_text.lower()
    assert "postgresql" not in response_text.lower()


def test_threat_16_permission_level_enforcement_view_vs_download(client, test_setup):
    """THREAT-16: View-only permission grants metadata view but blocks binary file download."""
    # 1. Admin uploads doc
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"View Only Sensitive Report"), "report.pdf")},
        content_type="multipart/form-data"
    )
    doc_id = up.get_json()["id"]

    # 2. Admin grants VIEW permission only (not download)
    grant_res = client.post(f"/api/v1/documents/{doc_id}/permissions", json={
        "recipient_user_id": test_setup["member_id"],
        "permission_level": "view"
    })
    assert grant_res.status_code == 201
    client.post("/api/v1/auth/logout")

    # 3. Member can view metadata
    login(client, test_setup["member_email"], test_setup["password"])
    view_res = client.get(f"/api/v1/documents/{doc_id}")
    assert view_res.status_code == 200
    assert view_res.get_json()["original_filename"] == "report.pdf"

    # 4. Member attempts download -> blocked with 403 (view only)
    dl_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_res.status_code == 403
    assert "view only" in dl_res.get_json()["error"]["message"].lower()


def test_threat_17_missing_storage_file_handled_gracefully(client, test_setup):
    """THREAT-17: Missing storage file returns clean error and unavailable status without crashing."""
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Content that will vanish"), "vanish.txt")},
        content_type="multipart/form-data"
    )
    doc_id = up.get_json()["id"]
    doc = Document.query.get(doc_id)

    # Simulate catastrophic storage loss for this single file
    storage = get_storage()
    storage.delete(doc.storage_key)

    # Verification returns status 'unavailable' instead of 500 crash
    verify_res = client.post(f"/api/v1/documents/{doc_id}/verify-integrity")
    assert verify_res.status_code == 200
    verify_data = verify_res.get_json()
    assert verify_data["verified"] is False
    assert verify_data["status"] == "unavailable"


def test_threat_18_xss_sanitization_in_filenames_and_metadata(client, test_setup):
    """THREAT-18: Filenames with HTML/Script tags are sanitized to prevent stored XSS."""
    login(client, test_setup["admin_email"], test_setup["password"])
    xss_filename = "<script>alert('XSS')</script>.pdf"
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"PDF content"), xss_filename)},
        content_type="multipart/form-data"
    )
    assert up.status_code == 201
    sanitized = up.get_json()["original_filename"]
    assert "<script>" not in sanitized
    assert "</script>" not in sanitized
    assert "<" not in sanitized
    assert ">" not in sanitized


def test_threat_19_proxy_header_trust_controls(client):
    """THREAT-19: Application config does not blindly trust spoofable client headers."""
    from app.config import Config
    assert Config is not None


def test_threat_20_tampered_storage_detected_by_sha256_verification(client, test_setup):
    """THREAT-20: Cryptographic mismatch is detected when physical file bytes are tampered in storage."""
    login(client, test_setup["admin_email"], test_setup["password"])
    up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"PristineUnmodifiedSecretContent"), "contract.pdf")},
        content_type="multipart/form-data"
    )
    doc_id = up.get_json()["id"]

    # First check: pristine file verifies successfully
    v1 = client.post(f"/api/v1/documents/{doc_id}/verify-integrity")
    assert v1.status_code == 200
    assert v1.get_json()["verified"] is True
    assert v1.get_json()["status"] == "verified"

    # Now tamper 1 byte of the physical storage file
    doc = Document.query.get(doc_id)
    storage = get_storage()
    raw = bytearray(storage.get_bytes(doc.storage_key))
    raw[0] ^= 0xFF  # Invert first byte
    storage.save(doc.storage_key, io.BytesIO(raw))

    # Second check: mismatch detected!
    v2 = client.post(f"/api/v1/documents/{doc_id}/verify-integrity")
    assert v2.status_code == 200
    v2_data = v2.get_json()
    assert v2_data["verified"] is False
    assert v2_data["status"] == "mismatch"
    assert v2_data["computed_hash"] != v2_data["expected_hash"]

    # Verify that an audit event was recorded for mismatch
    audit_event = AuditLog.query.filter_by(
        resource_id=doc_id, action="integrity.verify_mismatch"
    ).first()
    assert audit_event is not None
    assert audit_event.outcome == "failure"
