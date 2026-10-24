import json
from app.models import User, OrganizationMembership
from app.security.hashing import verify_password


def test_user_registration(client):
    payload = {
        "full_name": "David Founder",
        "email": "david@nexus.example",
        "password": "SecurePassword999!",
        "org_name": "Nexus Security",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["email"] == "david@nexus.example"
    assert data["organization"]["name"] == "Nexus Security"
    assert data["role"] == "admin"


def test_duplicate_email_rejection(client, test_setup):
    payload = {
        "full_name": "Fake Alice",
        "email": test_setup["admin_email"],
        "password": "DifferentPassword123!",
        "org_name": "Another Org",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409
    assert "already exists" in res.get_json()["error"]["message"]


def test_successful_login(client, test_setup):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["email"] == test_setup["admin_email"]
    assert data["role"] == "admin"

    # Test me endpoint with active session
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    assert me_res.get_json()["user"]["email"] == test_setup["admin_email"]


def test_invalid_login(client, test_setup):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": "WrongPassword!"},
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.get_json()["error"]["message"]


def test_logout(client, test_setup):
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # Subsequent request should be unauthorized
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 401


def test_unauthenticated_access_rejection(client):
    res = client.get("/api/v1/documents")
    assert res.status_code == 401


def test_password_reset_workflow(client, test_setup):
    email = test_setup["admin_email"]

    # 1. Request password reset for existing email
    req_res = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert req_res.status_code == 200
    data = req_res.get_json()
    assert "instructions have been generated" in data["message"]
    token = data.get("dev_reset_token")
    assert token is not None

    # 2. Request for non-existent email returns same message (no account enumeration)
    non_existent = client.post("/api/v1/auth/forgot-password", json={"email": "nobody@nowhere.example"})
    assert non_existent.status_code == 200
    assert "instructions have been generated" in non_existent.get_json()["message"]
    assert "dev_reset_token" not in non_existent.get_json()

    # 3. Reject reset with invalid or short password
    short_pw = client.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "short"})
    assert short_pw.status_code == 400

    # 4. Reject reset with corrupted token
    corrupt = client.post("/api/v1/auth/reset-password", json={"token": "invalid_corrupted_token", "new_password": "BrandNewPassword123!"})
    assert corrupt.status_code == 400

    # 5. Successful reset with valid token
    success_reset = client.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "BrandNewPassword123!"})
    assert success_reset.status_code == 200
    assert "successfully reset" in success_reset.get_json()["message"]

    # 6. Verify old password fails
    old_login = client.post("/api/v1/auth/login", json={"email": email, "password": test_setup["password"]})
    assert old_login.status_code == 401

    # 7. Verify new password succeeds
    new_login = client.post("/api/v1/auth/login", json={"email": email, "password": "BrandNewPassword123!"})
    assert new_login.status_code == 200

    # 8. Verify token cannot be re-used (single-use token)
    reuse = client.post("/api/v1/auth/reset-password", json={"token": token, "new_password": "AnotherNewPassword123!"})
    assert reuse.status_code == 400


def test_personal_workspace_registration(client):
    payload = {
        "full_name": "Elena Rostova",
        "email": "elena@personal.example",
        "password": "SecurePassword123!",
        "terms_accepted": True,
        "terms_version": "1.0",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data["user"]["full_name"] == "Elena Rostova"
    assert data["user"]["terms_version"] == "1.0"
    assert data["organization"]["name"] == "Elena's Workspace"
    assert data["organization"]["workspace_type"] == "personal"


def test_profile_update_and_theme_preference(client, test_setup):
    client.post(
        "/api/v1/auth/login",
        json={"email": test_setup["admin_email"], "password": test_setup["password"]},
    )
    # Update profile
    patch_res = client.patch(
        "/api/v1/auth/profile",
        json={"full_name": "Alice Administrator Updated", "theme_preference": "dark"},
    )
    assert patch_res.status_code == 200
    user_data = patch_res.get_json()["user"]
    assert user_data["full_name"] == "Alice Administrator Updated"
    assert user_data["theme_preference"] == "dark"

    # Reject invalid theme
    invalid_theme_res = client.patch(
        "/api/v1/auth/profile",
        json={"theme_preference": "neon_rainbow"},
    )
    assert invalid_theme_res.status_code == 400

