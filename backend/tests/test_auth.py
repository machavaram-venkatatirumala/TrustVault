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
