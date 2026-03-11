from fastapi import APIRouter, Cookie, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user_optional
from app.lib.auth import (
    create_session,
    generate_user_id,
    hash_password,
    invalidate_session,
    validate_email,
    verify_password,
)
from app.models import User
from app.schemas import AuthMeResponse, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/api/auth")


@router.post("/register")
def register(body: RegisterRequest, db: DBSession = Depends(get_db)):
    if not validate_email(body.email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    if len(body.password) < 8:
        raise HTTPException(
            status_code=400, detail="Password must be at least 8 characters"
        )

    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=generate_user_id(),
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()

    token = create_session(db, user.id)

    response = JSONResponse(content={"user": {"id": user.id, "email": user.email}})
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.session_expiry_days * 86400,
        path="/",
    )
    return response


@router.post("/login")
def login(body: LoginRequest, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_session(db, user.id)

    response = JSONResponse(content={"user": {"id": user.id, "email": user.email}})
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
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
