import io


def login(client, email, password):
    client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_grant_and_revoke_permission_workflow(client, test_setup):
    # 1. Admin uploads document
    login(client, test_setup["admin_email"], test_setup["password"])
    doc_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Exclusive strategy plan 2026."), "plan.txt")},
        content_type="multipart/form-data",
    )
    doc_id = doc_res.get_json()["id"]

    # 2. Member initially cannot download or access document
    login(client, test_setup["member_email"], test_setup["password"])
    download_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert download_res.status_code == 403

    # 3. Admin grants 'view' permission to Member
    login(client, test_setup["admin_email"], test_setup["password"])
    grant_res = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": test_setup["member_id"], "permission_level": "view"},
    )
    assert grant_res.status_code == 201
    perm_id = grant_res.get_json()["id"]

    # 4. Member checks shared-with-me
    login(client, test_setup["member_email"], test_setup["password"])
    shared_res = client.get("/api/v1/shared-with-me")
    assert shared_res.status_code == 200
    shared_docs = shared_res.get_json()["documents"]
    assert any(d["document_id"] == doc_id for d in shared_docs)

    # 5. Member tries download with 'view' permission -> should be rejected with 403
    dl_view_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_view_res.status_code == 403
    assert "view only" in dl_view_res.get_json()["error"]["message"].lower()

    # 6. Admin upgrades grant to 'download'
    login(client, test_setup["admin_email"], test_setup["password"])
    upgrade_res = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": test_setup["member_id"], "permission_level": "download"},
    )
    assert upgrade_res.status_code == 201
    new_perm_id = upgrade_res.get_json()["id"]

    # 7. Member can now download
    login(client, test_setup["member_email"], test_setup["password"])
    dl_ok_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert dl_ok_res.status_code == 200
    assert dl_ok_res.data == b"Exclusive strategy plan 2026."

    # 8. Admin revokes permission
    login(client, test_setup["admin_email"], test_setup["password"])
    revoke_res = client.delete(f"/api/v1/permissions/{new_perm_id}")
    assert revoke_res.status_code == 200

    # 9. Member download is now immediately blocked!
    login(client, test_setup["member_email"], test_setup["password"])
    blocked_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert blocked_res.status_code == 403
