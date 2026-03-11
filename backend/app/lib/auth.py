import hashlib
import os
import re
import time
from base64 import urlsafe_b64encode

from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.models import Session, User


def generate_session_token() -> str:
    return urlsafe_b64encode(os.urandom(18)).decode()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return salt.hex() + ":" + dk.hex()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt_hex, dk_hex = password_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return dk.hex() == dk_hex
    except (ValueError, AttributeError):
        return False


def validate_email(email: str) -> bool:
    return bool(re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email))


def generate_user_id() -> str:
    return urlsafe_b64encode(os.urandom(15)).decode()


def create_session(db: DBSession, user_id: str) -> str:
    token = generate_session_token()
    session = Session(
        id=hash_token(token),
        user_id=user_id,
        expires_at=int(time.time()) + settings.session_expiry_days * 86400,
    )
    db.add(session)
    db.commit()
    return token


def validate_session_token(
    db: DBSession, token: str
) -> tuple[Session, User] | None:
    session_id = hash_token(token)
    session = db.query(Session).filter(Session.id == session_id).first()
    if not session:
        return None

    if session.expires_at < int(time.time()):
        db.delete(session)
        db.commit()
        return None

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        return None

    # Auto-renew if within last 15 days
    renew_threshold = settings.session_expiry_days * 86400 // 2
    if session.expires_at - int(time.time()) < renew_threshold:
        session.expires_at = (
            int(time.time()) + settings.session_expiry_days * 86400
        )
        db.commit()

    return session, user


def invalidate_session(db: DBSession, token: str) -> None:
    session_id = hash_token(token)
    session = db.query(Session).filter(Session.id == session_id).first()
    if session:
        db.delete(session)
        db.commit()
