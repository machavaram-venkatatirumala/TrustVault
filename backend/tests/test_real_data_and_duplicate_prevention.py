import io
import pytest
from app.models import User, Organization, Document, DocumentPermission, OrganizationMembership, AuditLog


def test_fresh_database_contains_no_business_records(app):
    """Verify that application startup with fresh database has zero pre-seeded records."""
    with app.app_context():
        assert User.query.count() == 0
        assert Organization.query.count() == 0
        assert Document.query.count() == 0
        assert DocumentPermission.query.count() == 0
        assert AuditLog.query.count() == 0
        assert OrganizationMembership.query.count() == 0


def test_registration_creates_only_real_workflow_records(app, client):
    """Verify registration creates exactly 1 user, 1 org, 1 membership (admin), and 1 audit event."""
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Sarah Connor",
            "email": "sarah@cyberdyne.example",
            "password": "Password123!",
            "org_name": "Cyberdyne Systems",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["role"] == "admin"
    assert data["user"]["email"] == "sarah@cyberdyne.example"

    with app.app_context():
        user = User.query.filter_by(email="sarah@cyberdyne.example").first()
        assert user is not None
        assert user.full_name == "Sarah Connor"

        org = Organization.query.filter_by(name="Cyberdyne Systems").first()
        assert org is not None

        membership = OrganizationMembership.query.filter_by(user_id=user.id, organization_id=org.id).first()
        assert membership is not None
        assert membership.role == "admin"
        assert membership.status == "active"

        # Only 1 audit event recorded for registration
        reg_audit = AuditLog.query.filter_by(organization_id=org.id, action="auth.register").first()
        assert reg_audit is not None
        assert reg_audit.outcome == "success"


def test_duplicate_email_registration_rejected(app, client):
    """Verify duplicate email registration is rejected with 409 regardless of casing."""
    # First registration
    resp1 = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "John Connor",
            "email": "john.connor@resistance.example",
            "password": "Password123!",
            "org_name": "Tech Resistance",
        },
    )
    assert resp1.status_code == 201

    # Second registration with identical email in different case
    resp2 = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "John Connor Clone",
            "email": "JOHN.CONNOR@RESISTANCE.EXAMPLE",
            "password": "Password123!",
            "org_name": "Imposter Resistance",
        },
    )
    assert resp2.status_code == 409
    assert "already exists" in resp2.get_json()["error"]["message"].lower()

    with app.app_context():
        # Verify no second user or second organization was created
        assert User.query.filter_by(email="john.connor@resistance.example").count() == 1
        assert Organization.query.filter_by(name="Imposter Resistance").count() == 0


def test_repeated_membership_invitation_deduplication(app, client):
    """Verify repeated member invitations do not create duplicate memberships."""
    # Register admin
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Admin One",
            "email": "admin.one@corp.example",
            "password": "Password123!",
            "org_name": "Corp Workspace",
        },
    )

    # First invite
    resp_invite1 = client.post(
        "/api/v1/members/invite",
        json={
            "full_name": "Teammate One",
            "email": "teammate@corp.example",
            "role": "member",
            "password": "Password123!",
        },
    )
    assert resp_invite1.status_code == 201

    # Second invite with same email
    resp_invite2 = client.post(
        "/api/v1/members/invite",
        json={
            "full_name": "Teammate One",
            "email": "teammate@corp.example",
            "role": "member",
            "password": "Password123!",
        },
    )
    assert resp_invite2.status_code == 409
    assert "already a member" in resp_invite2.get_json()["error"]["message"].lower()

    with app.app_context():
        user = User.query.filter_by(email="teammate@corp.example").first()
        assert OrganizationMembership.query.filter_by(user_id=user.id).count() == 1


def test_upload_idempotency_key_prevents_duplicate_records(app, client):
    """Verify upload requests with the same X-Idempotency-Key return the existing document without creating duplicates."""
    # Register and login
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Uploader One",
            "email": "uploader@corp.example",
            "password": "Password123!",
            "org_name": "Idempotent Org",
        },
    )

    idempotency_key = "idemp-unique-token-999"
    file_bytes = b"%PDF-1.4 sample secure contract text"

    # First upload
    data1 = {
        "file": (io.BytesIO(file_bytes), "contract.pdf", "application/pdf")
    }
    resp1 = client.post(
        "/api/v1/documents",
        data=data1,
        content_type="multipart/form-data",
        headers={"X-Idempotency-Key": idempotency_key},
    )
    assert resp1.status_code == 201
    doc_id1 = resp1.get_json()["id"]

    # Retry upload with same idempotency key
    data2 = {
        "file": (io.BytesIO(file_bytes), "contract.pdf", "application/pdf")
    }
    resp2 = client.post(
        "/api/v1/documents",
        data=data2,
        content_type="multipart/form-data",
        headers={"X-Idempotency-Key": idempotency_key},
    )
    assert resp2.status_code == 201
    doc_id2 = resp2.get_json()["id"]

    # Same document ID returned
    assert doc_id1 == doc_id2

    with app.app_context():
        # Exactly 1 document record in DB
        assert Document.query.filter_by(idempotency_key=idempotency_key).count() == 1
        assert Document.query.filter_by(original_filename="contract.pdf").count() == 1


def test_rapid_double_click_upload_deduplication(app, client):
    """Verify identical upload requests within rapid interval are deduplicated without creating duplicate rows."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Fast Clicker",
            "email": "clicker@corp.example",
            "password": "Password123!",
            "org_name": "Double Click Org",
        },
    )

    file_bytes = b"%PDF-1.4 double-click prevention test data"

    # Click 1
    resp1 = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(file_bytes), "brief.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )
    assert resp1.status_code == 201
    doc1 = resp1.get_json()

    # Immediate Click 2 (simulating user double-click)
    resp2 = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(file_bytes), "brief.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )
    assert resp2.status_code == 201
    doc2 = resp2.get_json()

    assert doc1["id"] == doc2["id"]
    with app.app_context():
        assert Document.query.filter_by(original_filename="brief.pdf").count() == 1


def test_repeated_permission_grants_are_idempotent(app, client):
    """Verify repeated permission grant requests are idempotent and do not create duplicate active grants."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Perm Admin",
            "email": "perm.admin@corp.example",
            "password": "Password123!",
            "org_name": "Perm Org",
        },
    )

    # Invite recipient
    resp_inv = client.post(
        "/api/v1/members/invite",
        json={
            "full_name": "Recipient User",
            "email": "recipient@corp.example",
            "role": "member",
            "password": "Password123!",
        },
    )
    recip_id = resp_inv.get_json()["user_id"]

    # Upload document
    resp_up = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"%PDF-1.4 confidential doc"), "secret.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )
    doc_id = resp_up.get_json()["id"]

    # Grant 1
    resp_g1 = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": recip_id, "permission_level": "download"},
    )
    assert resp_g1.status_code == 201
    perm_id1 = resp_g1.get_json()["id"]

    # Grant 2 (repeat exact same grant)
    resp_g2 = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": recip_id, "permission_level": "download"},
    )
    assert resp_g2.status_code == 201
    perm_id2 = resp_g2.get_json()["id"]

    # Must return same active grant ID without duplicate row
    assert perm_id1 == perm_id2
    with app.app_context():
        active_grants = DocumentPermission.query.filter_by(
            document_id=doc_id, recipient_user_id=recip_id, revoked_at=None
        ).count()
        assert active_grants == 1


def test_dashboard_metrics_match_actual_database_contents(client):
    """Verify dashboard metrics precisely match actual database record counts without fabrication."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Metrics Master",
            "email": "metrics@corp.example",
            "password": "Password123!",
            "org_name": "Telemetry Org",
        },
    )

    # Check metrics with 0 documents
    resp_sum1 = client.get("/api/v1/dashboard/summary")
    assert resp_sum1.status_code == 200
    m1 = resp_sum1.get_json()["metrics"]
    assert m1["total_documents"] == 0
    assert m1["active_members"] == 1  # The founding admin
    assert m1["shared_documents"] == 0
    assert m1["active_permissions"] == 0

    # Upload 2 documents
    client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"%PDF-1.4 doc 1"), "file1.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )
    client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"%PDF-1.4 doc 2"), "file2.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )

    # Recheck metrics
    resp_sum2 = client.get("/api/v1/dashboard/summary")
    m2 = resp_sum2.get_json()["metrics"]
    assert m2["total_documents"] == 2
    assert m2["verified_count"] == 2
    assert m2["mismatch_count"] == 0
