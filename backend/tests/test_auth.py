import time

import pytest
from sqlalchemy import text

from app.config import settings
from app.lib.auth import (
    create_magic_link,
    create_session,
    generate_user_id,
    hash_token,
    invalidate_session,
    validate_magic_link,
    validate_session_token,
)
from app.models import MagicLink, Session, User

COOKIE_NAME = settings.session_cookie_name


def _create_user(db, email="test@example.com"):
    user = User(id=generate_user_id(), email=email)
    db.add(user)
    db.commit()
    return user


def test_send_magic_link(client):
    response = client.post(
        "/api/auth/send-magic-link",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Magic link sent"


def test_send_magic_link_invalid_email(client):
    response = client.post(
        "/api/auth/send-magic-link",
        json={"email": "invalid"},
    )
    assert response.status_code == 400


def test_verify_magic_link_creates_user(client, db):
    token = create_magic_link(db, "new@example.com")
    response = client.get(f"/auth/verify?token={token}", follow_redirects=False)
    assert response.status_code == 302
    assert "/dashboard" in response.headers["location"]

    user = db.query(User).filter(User.email == "new@example.com").first()
    assert user is not None


def test_verify_magic_link_existing_user(client, db):
    _create_user(db, "existing@example.com")
    token = create_magic_link(db, "existing@example.com")
    response = client.get(f"/auth/verify?token={token}", follow_redirects=False)
    assert response.status_code == 302
    assert "/dashboard" in response.headers["location"]

    users = db.query(User).filter(User.email == "existing@example.com").all()
    assert len(users) == 1


def test_verify_magic_link_invalid_token(client):
    response = client.get("/auth/verify?token=bogus", follow_redirects=False)
    assert response.status_code == 302
    assert "error=invalid_or_expired_link" in response.headers["location"]


def test_verify_magic_link_expired(client, db):
    token = create_magic_link(db, "test@example.com")
    link = db.query(MagicLink).first()
    link.expires_at = int(time.time()) - 1
    db.commit()

    response = client.get(f"/auth/verify?token={token}", follow_redirects=False)
    assert response.status_code == 302
    assert "error=invalid_or_expired_link" in response.headers["location"]


def test_magic_link_single_use(client, db):
    token = create_magic_link(db, "test@example.com")
    response1 = client.get(f"/auth/verify?token={token}", follow_redirects=False)
    assert response1.status_code == 302
    assert "/dashboard" in response1.headers["location"]

    response2 = client.get(f"/auth/verify?token={token}", follow_redirects=False)
    assert response2.status_code == 302
    assert "error=invalid_or_expired_link" in response2.headers["location"]


def test_magic_link_replaces_previous(db):
    token1 = create_magic_link(db, "test@example.com")
    token2 = create_magic_link(db, "test@example.com")

    result1 = validate_magic_link(db, token1)
    assert result1 is None

    result2 = validate_magic_link(db, token2)
    assert result2 is not None
    assert result2["email"] == "test@example.com"


def test_me_authenticated(client, db):
    user = _create_user(db)
    token = create_session(db, user.id)
    client.cookies.set(COOKIE_NAME, token)
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test@example.com"


def test_me_unauthenticated(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["user"] is None


def test_logout(client, db):
    user = _create_user(db)
    token = create_session(db, user.id)
    client.cookies.set(COOKIE_NAME, token)
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_logout_without_session(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_me_with_invalid_token(client):
    client.cookies.set(COOKIE_NAME, "bogus-token")
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    assert response.json()["user"] is None


def test_expired_session(client, db):
    user = _create_user(db)
    token = create_session(db, user.id)

    session = db.query(Session).filter(Session.id == hash_token(token)).first()
    session.expires_at = int(time.time()) - 1
    db.commit()

    result = validate_session_token(db, token)
    assert result is None
    assert db.query(Session).filter(Session.id == hash_token(token)).first() is None


def test_session_for_deleted_user(client, db):
    user = _create_user(db)
    token = create_session(db, user.id)

    db.execute(text("ALTER TABLE session DROP CONSTRAINT session_user_id_fkey"))
    db.execute(text('DELETE FROM "user" WHERE id = :id'), {"id": user.id})
    db.commit()
    db.expire_all()

    result = validate_session_token(db, token)
    assert result is None


def test_session_auto_renewal(client, db):
    user = _create_user(db)
    token = create_session(db, user.id)

    session = db.query(Session).filter(Session.id == hash_token(token)).first()
    session.expires_at = int(time.time()) + 100
    db.commit()
    old_expiry = session.expires_at

    result = validate_session_token(db, token)
    assert result is not None
    refreshed = db.query(Session).filter(Session.id == hash_token(token)).first()
    assert refreshed.expires_at > old_expiry


def test_invalidate_nonexistent_session(db):
    invalidate_session(db, "nonexistent-token")


def test_get_current_user_raises_when_no_user():
    from fastapi import HTTPException

    from app.dependencies import get_current_user

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(user=None)
    assert exc_info.value.status_code == 401


def test_get_current_user_returns_user(db):
    from app.dependencies import get_current_user

    user = User(id="test-id", email="test@example.com")
    result = get_current_user(user=user)
    assert result.id == "test-id"
