from fastapi import Cookie, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.database import get_db
from app.lib.auth import validate_session_token
from app.models import User


def get_current_user_optional(
    db: DBSession = Depends(get_db),
    session_token: str | None = Cookie(None, alias=settings.session_cookie_name),
) -> User | None:
    if not session_token:
        return None
    result = validate_session_token(db, session_token)
    if not result:
        return None
    return result[1]


def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
