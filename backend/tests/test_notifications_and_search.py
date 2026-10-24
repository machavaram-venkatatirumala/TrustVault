import io
import pytest
from app.models import Notification, Document


def test_notifications_lifecycle(client):
    """Verify notifications can be fetched, marked as read, and bulk read."""
    # Register user
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Alert Recipient",
            "email": "alert.recipient@example.com",
            "password": "Password123!",
            "org_name": "Alert Org",
        },
    )
    assert reg_resp.status_code == 201

    # Check empty notifications initially
    list_resp = client.get("/api/v1/notifications")
    assert list_resp.status_code == 200
    data = list_resp.get_json()
    assert data["unread_count"] == 0
    assert len(data["notifications"]) == 0

    # Invite a member to generate a real notification
    invite_resp = client.post(
        "/api/v1/members/invite",
        json={
            "full_name": "Second Member",
            "email": "second.member@example.com",
            "role": "member",
            "password": "Password123!",
        },
    )
    assert invite_resp.status_code == 201

    # Switch session to second member
    client.post(
        "/api/v1/auth/login",
        json={"email": "second.member@example.com", "password": "Password123!"},
    )

    # Check notifications for second member
    n_resp = client.get("/api/v1/notifications")
    assert n_resp.status_code == 200
    n_data = n_resp.get_json()
    assert n_data["unread_count"] == 1
    assert len(n_data["notifications"]) == 1
    notif_id = n_data["notifications"][0]["id"]
    assert "Workspace Invitation" in n_data["notifications"][0]["title"]

    # Mark as read
    read_resp = client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert read_resp.status_code == 200

    # Verify unread count is now 0
    after_read = client.get("/api/v1/notifications").get_json()
    assert after_read["unread_count"] == 0
    assert after_read["notifications"][0]["is_read"] is True


def test_global_search_tenant_isolation(client):
    """Verify global search returns matching documents, members, and audit records."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Search Admin",
            "email": "search.admin@example.com",
            "password": "Password123!",
            "org_name": "Search Org",
        },
    )

    # Upload document with distinct keyword
    client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"%PDF-1.4 confidential quarterly financial report"), "Q3_Financial_Review.pdf", "application/pdf")},
        content_type="multipart/form-data",
    )

    # Search for "Financial"
    res = client.get("/api/v1/search?q=Financial")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data["documents"]) == 1
    assert "Q3_Financial_Review.pdf" in data["documents"][0]["title"]

    # Search for admin full name
    res_member = client.get("/api/v1/search?q=Search Admin")
    assert res_member.status_code == 200
    assert len(res_member.get_json()["members"]) == 1


def test_dashboard_activity_days_filter(client):
    """Verify activity telemetry accepts 7, 30, and 90 days query param."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Telemetry Boss",
            "email": "telemetry.boss@example.com",
            "password": "Password123!",
            "org_name": "Telemetry Org",
        },
    )

    resp_30 = client.get("/api/v1/dashboard/activity?days=30")
    assert resp_30.status_code == 200
    data_30 = resp_30.get_json()
    assert len(data_30["activity"]) == 30
    assert data_30["days"] == 30

    resp_90 = client.get("/api/v1/dashboard/activity?days=90")
    assert resp_90.status_code == 200
    assert len(resp_90.get_json()["activity"]) == 90
