from app.config import settings

COOKIE_NAME = settings.session_cookie_name


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"
    assert "id" in data["user"]


def test_register_duplicate_email(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password456"},
    )
    assert response.status_code == 400


def test_register_invalid_email(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "invalid", "password": "password123"},
    )
    assert response.status_code == 400


def test_register_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "short"},
    )
    assert response.status_code == 400


def test_login(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_me_authenticated(client):
    register_response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    token = register_response.cookies.get(COOKIE_NAME)
    client.cookies.set(COOKIE_NAME, token)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"


def test_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["user"] is None


def test_logout(client):
    register_response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    token = register_response.cookies.get(COOKIE_NAME)
    client.cookies.set(COOKIE_NAME, token)
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True
