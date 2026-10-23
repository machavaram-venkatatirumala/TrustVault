import io
from app.utils.crypto import calculate_sha256_bytes


def login(client, email, password):
    client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_document_upload(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    file_content = b"%PDF-1.4\nTesting confidential document content for TrustVault."
    expected_hash = calculate_sha256_bytes(file_content)

    data = {
        "file": (io.BytesIO(file_content), "Board_Meeting_Minutes.pdf"),
    }

    res = client.post("/api/v1/documents", data=data, content_type="multipart/form-data")
    assert res.status_code == 201
    doc = res.get_json()
    assert doc["original_filename"] == "Board_Meeting_Minutes.pdf"
    assert doc["size_bytes"] == len(file_content)
    assert doc["sha256_hash"] == expected_hash
    assert doc["last_verification_status"] == "verified"


def test_empty_document_upload_rejected(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    data = {"file": (io.BytesIO(b""), "empty.pdf")}
    res = client.post("/api/v1/documents", data=data, content_type="multipart/form-data")
    assert res.status_code == 400


def test_document_download_authorized(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    file_content = b"Confidential financial statement 2026."
    res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(file_content), "statement.txt")},
        content_type="multipart/form-data",
    )
    doc_id = res.get_json()["id"]

    download_res = client.get(f"/api/v1/documents/{doc_id}/download")
    assert download_res.status_code == 200
    assert download_res.data == file_content
    assert "attachment" in download_res.headers.get("Content-Disposition", "")


def test_document_deletion(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    file_content = b"Draft proposal to delete."
    res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(file_content), "draft.txt")},
        content_type="multipart/form-data",
    )
    doc_id = res.get_json()["id"]

    del_res = client.delete(f"/api/v1/documents/{doc_id}")
    assert del_res.status_code == 200

    # Subsequent fetch should be 404
    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 404


def test_document_rename(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    file_content = b"Content to rename."
    res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(file_content), "Original_Name.pdf")},
        content_type="multipart/form-data",
    )
    doc_id = res.get_json()["id"]

    # 1. Successful rename by admin
    rename_res = client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"filename": "Renamed_Document.pdf"},
    )
    assert rename_res.status_code == 200
    assert rename_res.get_json()["original_filename"] == "Renamed_Document.pdf"

    # Verify get reflects the new name
    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.get_json()["original_filename"] == "Renamed_Document.pdf"

    # 2. Rejection of empty filename
    empty_res = client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"filename": "   "},
    )
    assert empty_res.status_code == 400

    # 3. Rejection of rename by unauthorized member (who is not owner)
    login(client, test_setup["member_email"], test_setup["password"])
    unauth_rename = client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"filename": "Hacked_Name.pdf"},
    )
    assert unauth_rename.status_code == 403

