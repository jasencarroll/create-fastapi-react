import time

from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(Integer, default=lambda: int(time.time()))
    updated_at = Column(
        Integer, default=lambda: int(time.time()), onupdate=lambda: int(time.time())
    )


class Session(Base):
    __tablename__ = "session"

    id = Column(String, primary_key=True)  # SHA-256 hash of token
    user_id = Column(String, ForeignKey("user.id"), nullable=False, index=True)
    expires_at = Column(Integer, nullable=False)
