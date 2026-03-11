from fastapi import APIRouter, Cookie, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user_optional
from app.lib.auth import (
    create_magic_link,
    create_session,
    generate_user_id,
    invalidate_session,
    validate_email,
    validate_magic_link,
)
from app.models import User
from app.schemas import AuthMeResponse, SendMagicLinkRequest, UserResponse

router = APIRouter(prefix="/api/auth")
verify_router = APIRouter()


@router.post("/send-magic-link")
def send_magic_link(body: SendMagicLinkRequest, db: DBSession = Depends(get_db)):
    if not validate_email(body.email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    token = create_magic_link(db, body.email)
    verify_url = f"{settings.app_url}/auth/verify?token={token}"

    print(f"[DEV] Magic link for {body.email}: {verify_url}")

    return {"message": "Magic link sent"}


@verify_router.get("/auth/verify")
def verify(token: str, db: DBSession = Depends(get_db)):
    result = validate_magic_link(db, token)
    if not result:
        return RedirectResponse(
            url="/auth?error=invalid_or_expired_link", status_code=302
        )

    email = result["email"]
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(id=generate_user_id(), email=email)
        db.add(user)
        db.commit()

    session_token = create_session(db, user.id)

    response = RedirectResponse(url="/dashboard", status_code=302)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.session_expiry_days * 86400,
        path="/",
    )
    return response


@router.get("/me")
def me(user: User | None = Depends(get_current_user_optional)):
    if user:
        return AuthMeResponse(user=UserResponse(id=user.id, email=user.email))
    return AuthMeResponse(user=None)


@router.post("/logout")
def logout(
    db: DBSession = Depends(get_db),
    session_token: str | None = Cookie(None, alias=settings.session_cookie_name),
):
    if session_token:
        invalidate_session(db, session_token)

    response = JSONResponse(content={"success": True})
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return response
