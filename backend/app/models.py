import time

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.audit import AuditMixin
from app.database import Base


class User(AuditMixin, Base):
    __tablename__ = "user"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)


class Session(Base):
    __tablename__ = "session"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("user.id"), index=True)
    expires_at: Mapped[int] = mapped_column()


class MagicLink(Base):
    __tablename__ = "magic_link"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[int] = mapped_column()
    created_at: Mapped[int] = mapped_column(default=lambda: int(time.time()))
