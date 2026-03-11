import time

from sqlalchemy import Column, ForeignKey, Integer, String

from app.database import Base


class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(Integer, default=lambda: int(time.time()))
    updated_at = Column(
        Integer, default=lambda: int(time.time()), onupdate=lambda: int(time.time())
    )


class Session(Base):
    __tablename__ = "session"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False, index=True)
    expires_at = Column(Integer, nullable=False)


class MagicLink(Base):
    __tablename__ = "magic_link"

    id = Column(String, primary_key=True)
    email = Column(String, nullable=False)
    expires_at = Column(Integer, nullable=False)
    created_at = Column(Integer, default=lambda: int(time.time()))
