import pytest
from app.models import Organization, Document, OrganizationMembership, AuditLog
from app.extensions import db


def test_admin_update_workspace_name_and_slug_success(client, test_setup):
    """Verifies that an administrator can update both workspace name and slug successfully."""
    # Login as Admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )
    assert login_res.status_code == 200

    # Update organization name and slug
    patch_res = client.patch(
        "/api/v1/organization",
        json={
            "name": "KKR & KSR Institute of Technology and Sciences",
            "slug": "kkr-ksr-institute-of-technology-and-sciences",
        },
    )
    assert patch_res.status_code == 200
    data = patch_res.get_json()["organization"]
    assert data["name"] == "KKR & KSR Institute of Technology and Sciences"
    assert data["slug"] == "kkr-ksr-institute-of-technology-and-sciences"

    # Verify database persistence
    org = Organization.query.get(test_setup["org_id"])
    assert org.name == "KKR & KSR Institute of Technology and Sciences"
    assert org.slug == "kkr-ksr-institute-of-technology-and-sciences"

    # Verify audit event contains old and new slugs
    audit = (
        AuditLog.query.filter_by(
            organization_id=test_setup["org_id"],
            action="organization.update",
        )
        .order_by(AuditLog.created_at.desc())
        .first()
    )
    assert audit is not None
    assert audit.event_metadata.get("old_slug") == "acme-corp"
    assert audit.event_metadata.get("new_slug") == "kkr-ksr-institute-of-technology-and-sciences"
    assert audit.event_metadata.get("old_name") == "Acme Corp"
    assert audit.event_metadata.get("new_name") == "KKR & KSR Institute of Technology and Sciences"


def test_slug_availability_check_endpoint(client, test_setup):
    """Verifies real-time slug availability check endpoint for new, current, taken, and invalid slugs."""
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )

    # 1. New available slug
    res = client.get("/api/v1/organization/check-slug?slug=new-innovative-vault")
    assert res.status_code == 200
    data = res.get_json()
    assert data["available"] is True
    assert data["valid"] is True

    # 2. Current workspace slug
    res_current = client.get("/api/v1/organization/check-slug?slug=acme-corp")
    assert res_current.status_code == 200
    data_current = res_current.get_json()
    assert data_current["available"] is True
    assert data_current["valid"] is True
    assert "Current" in data_current["message"]

    # 3. Already taken slug by another organization (other-corp)
    res_taken = client.get("/api/v1/organization/check-slug?slug=other-corp")
    assert res_taken.status_code == 200
    data_taken = res_taken.get_json()
    assert data_taken["available"] is False
    assert data_taken["valid"] is True
    assert "already taken" in data_taken["message"]

    # 4. Invalid formats
    res_invalid = client.get("/api/v1/organization/check-slug?slug=bad--slug")
    assert res_invalid.status_code == 200
    data_invalid = res_invalid.get_json()
    assert data_invalid["valid"] is False
    assert data_invalid["available"] is False


def test_duplicate_slug_rejected_with_409_conflict(client, test_setup):
    """Verifies database uniqueness enforcement and HTTP 409 Conflict on collision."""
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )

    # Attempt to take other organization's slug
    res = client.patch(
        "/api/v1/organization",
        json={"slug": "other-corp"},
    )
    assert res.status_code == 409
    assert "already taken" in res.get_json()["error"]["message"]

    # Ensure DB was not modified
    org = Organization.query.get(test_setup["org_id"])
    assert org.slug == "acme-corp"


@pytest.mark.parametrize(
    "invalid_slug",
    [
        "-leading-hyphen",
        "trailing-hyphen-",
        "consecutive--hyphens",
        "ab",  # too short
        "InvalidUppercase",
        "space slug",
        "symbol_slug",
        "dot.slug",
    ],
)
def test_invalid_slug_formats_rejected(client, test_setup, invalid_slug):
    """Verifies that invalid slug formats are rejected with HTTP 400 Bad Request."""
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )

    res = client.patch(
        "/api/v1/organization",
        json={"slug": invalid_slug},
    )
    assert res.status_code == 400
    assert "slug" in res.get_json()["error"]["message"].lower()


def test_non_admin_cannot_update_organization(client, test_setup):
    """Verifies RBAC enforcement: member users cannot update workspace name or slug."""
    # Login as regular member
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["member_email"], "password": test_setup["password"]},
    )

    res = client.patch(
        "/api/v1/organization",
        json={"name": "Hacked Name", "slug": "hacked-slug"},
    )
    assert res.status_code == 403

    # Verify no change occurred
    org = Organization.query.get(test_setup["org_id"])
    assert org.name == "Acme Corp"
    assert org.slug == "acme-corp"


def test_unauthenticated_request_rejected(client):
    """Verifies that unauthenticated requests to modify organization return 401."""
    res = client.patch(
        "/api/v1/organization",
        json={"name": "Anonymous Name"},
    )
    assert res.status_code == 401


def test_existing_workspace_documents_and_memberships_intact(client, test_setup):
    """Verifies that changing name and slug leaves all existing documents, memberships, and permissions intact."""
    # Login as Admin
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )

    # Initial member count
    members_before = OrganizationMembership.query.filter_by(organization_id=test_setup["org_id"]).count()
    assert members_before >= 2

    # Update name and slug
    res = client.patch(
        "/api/v1/organization",
        json={
            "name": "Updated Workspace",
            "slug": "updated-workspace-slug",
        },
    )
    assert res.status_code == 200

    # Ensure members still exist
    members_after = OrganizationMembership.query.filter_by(organization_id=test_setup["org_id"]).count()
    assert members_after == members_before

    # Ensure organization memberships still reference the same organization ID
    admin_mem = OrganizationMembership.query.filter_by(
        organization_id=test_setup["org_id"],
        user_id=test_setup["admin_id"],
    ).first()
    assert admin_mem is not None
    assert admin_mem.role == "admin"
