import pytest

def test_register_and_login_flow(client):
    # Register new user
    reg_payload = {
        "username": "test_analyst",
        "email": "test@flowsense.ai",
        "password": "SecurePassword123!"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["username"] == "test_analyst"
    assert data["user"]["role"] == "analyst"

    token = data["access_token"]

    # Access protected /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["username"] == "test_analyst"
    assert me_data["email"] == "test@flowsense.ai"

    # Login with valid credentials
    login_payload = {
        "username_or_email": "test_analyst",
        "password": "SecurePassword123!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

    # Login with invalid password
    bad_login = {
        "username_or_email": "test_analyst",
        "password": "WrongPassword!"
    }
    bad_res = client.post("/api/auth/login", json=bad_login)
    assert bad_res.status_code == 401

def test_unauthorized_access(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

