import io


def login(client, email, password):
    client.post("/api/v1/auth/login", json={"email": email, "password": password})


def test_sha256_integrity_verification_workflow(client, test_setup):
    login(client, test_setup["admin_email"], test_setup["password"])

    content = b"Untampered enterprise audit file."
    doc_res = client.post(
        "/api/v1/documents",
        data={"file": (io.BytesIO(content), "audit.txt")},
        content_type="multipart/form-data",
    )
    doc_id = doc_res.get_json()["id"]

    # 1. Verification of untampered file
    verify_res = client.post(f"/api/v1/documents/{doc_id}/verify-integrity")
    assert verify_res.status_code == 200
    v_data = verify_res.get_json()
    assert v_data["verified"] is True
    assert v_data["status"] == "verified"
    assert v_data["expected_hash"] == v_data["computed_hash"]

    # 2. Simulate file tampering in private storage
    tamper_res = client.post(f"/api/v1/documents/{doc_id}/simulate-tamper")
    assert tamper_res.status_code == 200

    # 3. Verify integrity again -> must detect cryptographic mismatch!
    mismatch_res = client.post(f"/api/v1/documents/{doc_id}/verify-integrity")
    assert mismatch_res.status_code == 200
    m_data = mismatch_res.get_json()
    assert m_data["verified"] is False
    assert m_data["status"] == "mismatch"
    assert m_data["expected_hash"] != m_data["computed_hash"]
    assert "Cryptographic mismatch" in m_data["message"]
