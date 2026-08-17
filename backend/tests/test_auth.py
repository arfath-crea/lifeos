def test_demo_login(client):
    response = client.post("/api/v1/auth/demo")
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alex@lifeos.dev"

def test_register_and_login(client):
    reg_payload = {
        "email": "sarah.connor@lifeos.dev",
        "password": "SecurePassword123!",
        "full_name": "Sarah Connor"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "sarah.connor@lifeos.dev"
    
    # Login with new account
    login_res = client.post("/api/v1/auth/login", json={"email": "sarah.connor@lifeos.dev", "password": "SecurePassword123!"})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_get_me(client, auth_headers):
    res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["full_name"] == "Alex Mercer"
