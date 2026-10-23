import io


def login(client, email, password):
    client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_cross_tenant_document_access_rejected(client, test_setup):
    # 1. Admin of Acme Corp uploads a confidential document
    login(client, test_setup["admin_email"], test_setup["password"])
    doc_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"Acme proprietary secret."), "secret.txt")},
        content_type="multipart/form-data",
    )
    acme_doc_id = doc_res.get_json()["id"]

    # 2. User from Other Corp tries to access Acme's document by guessing ID
    login(client, "charlie@other.example", test_setup["password"])

    # Attempt to fetch metadata
    meta_res = client.get(f"/api/v1/documents/{acme_doc_id}")
    assert meta_res.status_code == 404

    # Attempt to download
    dl_res = client.get(f"/api/v1/documents/{acme_doc_id}/download")
    assert dl_res.status_code == 404

    # Attempt to verify integrity
    v_res = client.post(f"/api/v1/documents/{acme_doc_id}/verify-integrity")
    assert v_res.status_code == 404


def test_cross_tenant_permission_grant_rejected(client, test_setup):
    # Acme Admin attempts to grant permission to a user from Other Corp
    login(client, test_setup["admin_email"], test_setup["password"])
    doc_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(b"M&A Evaluation."), "mna.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = doc_res.get_json()["id"]

    grant_res = client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        json={"recipient_user_id": test_setup["other_user_id"], "permission_level": "view"},
    )
    assert grant_res.status_code == 400
    assert "not an active member of this organization" in grant_res.get_json()["error"]["message"]
