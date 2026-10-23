import io


def login(client, email, password):
    client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_audit_logs_restricted_to_admins(client, test_setup):
    # Member attempts to read audit logs -> rejected with 403
    login(client, test_setup["member_email"], test_setup["password"])
    res = client.get("/api/v1/audit-events")
    assert res.status_code == 403
    assert "Administrative privileges required" in res.get_json()["error"]["message"]


def test_audit_log_generation_and_admin_query(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    # Upload document to trigger document.upload audit log
    client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Data room file."), "dataroom.pdf")},
        content_type="multipart/form-data",
    )

    # Admin reads audit logs
    audit_res = client.get("/api/v1/audit-events")
    assert audit_res.status_code == 200
    events = audit_res.get_json()["events"]
    assert len(events) > 0

    # Verify upload event exists
    actions = [e["action"] for e in events]
    assert "document.upload" in actions

    # Verify filtering
    upload_filter_res = client.get("/api/v1/audit-events?action=document.upload")
    assert upload_filter_res.status_code == 200
    filtered_events = upload_filter_res.get_json()["events"]
    assert all(e["action"] == "document.upload" for e in filtered_events)
