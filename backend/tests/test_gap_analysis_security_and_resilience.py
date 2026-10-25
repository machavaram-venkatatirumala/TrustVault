import io
import time
import pytest
from app.models import Document, DocumentPermission, Organization, User, AccessReviewCampaign, AccessReviewItem
from app.extensions import db


def login(client, email, password="Password123!"):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_cross_tenant_access_review_isolation(client, test_setup):
    """
    CRITICAL TENANT ISOLATION GAP TEST:
    An admin from Organization B must NOT be able to inspect or decide review items
    belonging to an access review campaign in Organization A.
    """
    # 1. Login as Alice (Admin Org A) and create a campaign
    login(client, test_setup["admin_email"], test_setup["password"])

    camp_res = client.post(
        "/api/v1/governance/access-reviews",
        json={"title": "Org A Confidential Review", "days_valid": 10},
    )
    assert camp_res.status_code == 201
    campaign_id = camp_res.get_json()["id"]

    # Retrieve campaign items
    items_res = client.get(f"/api/v1/governance/access-reviews/{campaign_id}/items")
    assert items_res.status_code == 200
    assert "campaign" in items_res.get_json()
    assert items_res.get_json()["campaign"]["title"] == "Org A Confidential Review"

    # 2. Register Eve (Admin of Org B)
    client.post("/api/v1/auth/logout")
    eve_res = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Eve Adversary",
            "email": "eve.adversary@tenant-b.com",
            "password": "Password123!",
            "org_name": "Tenant B Corp",
        },
    )
    assert eve_res.status_code == 201

    # 3. Eve (Admin Org B) attempts to inspect Org A's campaign items -> 404
    eve_get = client.get(f"/api/v1/governance/access-reviews/{campaign_id}/items")
    assert eve_get.status_code == 404

    # 4. Eve attempts to decide/alter an item in Org A's campaign -> 404
    eve_decide = client.post(
        f"/api/v1/governance/access-reviews/{campaign_id}/items/fake-item-id/decide",
        json={"decision": "revoked", "notes": "Unauthorized cross-tenant sabotage attempt"},
    )
    assert eve_decide.status_code == 404


def test_revoked_share_invalidates_signed_url_immediately(client, test_setup):
    """
    REVOKED SHARE / SIGNED URL SECURITY GAP TEST:
    If a recipient generates a signed download URL, and their sharing permission
    is subsequently revoked by the owner/admin, subsequent attempts to download
    via the signed URL MUST be denied with 403 Forbidden.
    """
    # 1. Alice (Admin) uploads a document
    login(client, test_setup["admin_email"], test_setup["password"])
    up_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Financial Ledger Confidential 2026"), "ledger.xlsx")},
        content_type="multipart/form-data",
    )
    assert up_res.status_code == 201
    doc_id = up_res.get_json()["id"]

    # 2. Alice shares document with Bob with download permission
    share_res = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": test_setup["member_id"], "permission_level": "download"},
    )
    assert share_res.status_code == 201
    perm_id = share_res.get_json()["id"]

    # 3. Bob logs in and generates a signed download URL valid for 15 minutes
    login(client, test_setup["member_email"], test_setup["password"])
    signed_res = client.post(
        f"/api/v1/documents/{doc_id}/signed-url",
        json={"expires_in_seconds": 900},
    )
    assert signed_res.status_code == 200
    signed_url = signed_res.get_json()["signed_url"]

    # Bob logs out; unauthenticated download via signed URL succeeds while permission is active
    client.post("/api/v1/auth/logout")
    dl_valid = client.get(signed_url)
    assert dl_valid.status_code == 200
    assert dl_valid.data == b"Financial Ledger Confidential 2026"

    # 4. Alice logs in and revokes Bob's permission
    login(client, test_setup["admin_email"], test_setup["password"])
    revoke_res = client.delete(f"/api/v1/permissions/{perm_id}")
    assert revoke_res.status_code == 200
    client.post("/api/v1/auth/logout")

    # 5. Bob tries to use his signed URL again: MUST FAIL WITH 403 FORBIDDEN!
    dl_after_revocation = client.get(signed_url)
    assert dl_after_revocation.status_code == 403
    assert "permission" in dl_after_revocation.get_json()["error"]["message"].lower()


def test_expired_signed_url_rejected(client, test_setup):
    """
    EXPIRED SIGNED URL SECURITY TEST:
    A signed URL with an expired timestamp in the past must be rejected.
    """
    login(client, test_setup["admin_email"], test_setup["password"])
    up_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Ephemeral Secrets Content"), "secrets.txt")},
        content_type="multipart/form-data",
    )
    doc_id = up_res.get_json()["id"]

    signed_res = client.post(
        f"/api/v1/documents/{doc_id}/signed-url",
        json={"expires_in_seconds": 1},
    )
    signed_url = signed_res.get_json()["signed_url"]
    client.post("/api/v1/auth/logout")

    # Sleep 2 seconds so it expires
    time.sleep(2)

    expired_res = client.get(signed_url)
    assert expired_res.status_code == 401


def test_out_of_bounds_pagination_safe_empty_results(client, test_setup):
    """
    PAGINATION RESILIENCE TEST:
    Querying high page numbers (e.g. page 999) returns an empty list without 500 crashes.
    """
    login(client, test_setup["admin_email"], test_setup["password"])

    res = client.get("/api/v1/documents?page=999&per_page=20")
    assert res.status_code == 200
    data = res.get_json()
    assert data["documents"] == []
    assert data["page"] == 999
    assert data["total"] >= 0

    audit_res = client.get("/api/v1/audit-events?page=999&per_page=20")
    assert audit_res.status_code == 200
    audit_data = audit_res.get_json()
    assert audit_data["events"] == []
    assert audit_data["page"] == 999
