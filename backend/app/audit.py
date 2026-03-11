"""Compliance audit primitives — Part 11 compatible.

Provides:
- AuditMixin: created_by, updated_by, created_at, updated_at columns
- AuditLog: append-only table capturing before/after state on every mutation
- SQLAlchemy event listeners that auto-stamp fields and write audit records
- Context variable for tracking the current actor (set by request middleware)
"""

import json
import time
import uuid
from contextvars import ContextVar

from sqlalchemy import Column, ForeignKey, Integer, String, Text, event
from sqlalchemy.orm import Session as DBSession
from sqlalchemy.orm import object_mapper

from app.database import Base

# Set by the dependency layer on each request; read by event listeners.
# Value is the user ID string, or None for system/anonymous actions.
current_actor_id: ContextVar[str | None] = ContextVar("current_actor_id", default=None)


class AuditMixin:
    """Mixin that adds audit columns to any model.

    created_by/updated_by are nullable to handle system actions (e.g. registration).
    """

    created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    updated_at = Column(
        Integer,
        nullable=False,
        default=lambda: int(time.time()),
        onupdate=lambda: int(time.time()),
    )
    created_by = Column(String, ForeignKey("user.id"), nullable=True)
    updated_by = Column(String, ForeignKey("user.id"), nullable=True)


class AuditLog(Base):
    """Append-only audit log. Captures before/after JSON for every mutation.

    Supports reconstructing the state of any record at any point in time (Part 11).
    This table should never be UPDATEd or DELETEd in application code.
    """

    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, default=lambda: uuid.uuid4().hex)
    table_name = Column(String, nullable=False, index=True)
    record_id = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)  # INSERT, UPDATE, DELETE
    old_data = Column(Text, nullable=True)  # JSON, null for INSERT
    new_data = Column(Text, nullable=True)  # JSON, null for DELETE
    actor_id = Column(String, ForeignKey("user.id"), nullable=True)
    timestamp = Column(Integer, nullable=False, default=lambda: int(time.time()))


def _serialize_row(obj) -> dict:
    """Serialize a SQLAlchemy model instance to a dict of column values."""
    mapper = object_mapper(obj)
    return {col.key: getattr(obj, col.key) for col in mapper.column_attrs}


def _get_primary_key(obj) -> str:
    """Get the primary key value as a string."""
    mapper = object_mapper(obj)
    pk_cols = mapper.primary_key
    pk_values = [getattr(obj, col.name) for col in pk_cols]
    return str(pk_values[0]) if len(pk_values) == 1 else json.dumps(pk_values)


def _is_auditable(obj) -> bool:
    """Skip audit logging for the AuditLog table itself and Session table."""
    return obj.__tablename__ not in ("audit_log", "session")


def _stamp_actor(obj):
    """Auto-stamp created_by/updated_by from context var."""
    actor = current_actor_id.get()
    if actor is None:
        return
    mapper = object_mapper(obj)
    col_names = {col.key for col in mapper.column_attrs}
    if "updated_by" in col_names:
        obj.updated_by = actor
    if "created_by" in col_names and getattr(obj, "created_by", None) is None:
        obj.created_by = actor


def _write_audit_log(
    session: DBSession, action: str, obj, old_data=None, new_data=None
):
    """Write an audit log entry. Uses the same session to ensure atomicity."""
    actor = current_actor_id.get()
    entry = AuditLog(
        id=uuid.uuid4().hex,
        table_name=obj.__tablename__,
        record_id=_get_primary_key(obj),
        action=action,
        old_data=json.dumps(old_data) if old_data else None,
        new_data=json.dumps(new_data) if new_data else None,
        actor_id=actor,
        timestamp=int(time.time()),
    )
    session.add(entry)


def register_audit_listeners():
    """Register SQLAlchemy event listeners for audit stamping and logging.

    Call once at app startup after all models are imported.
    """

    @event.listens_for(DBSession, "before_flush")
    def before_flush(session, flush_context, instances):
        # Handle new objects
        for obj in session.new:
            if not _is_auditable(obj):
                continue
            _stamp_actor(obj)
            new_data = _serialize_row(obj)
            _write_audit_log(session, "INSERT", obj, new_data=new_data)

        # Handle modified objects
        for obj in session.dirty:
            if not session.is_modified(obj) or not _is_auditable(obj):
                continue
            _stamp_actor(obj)
            # Capture old values from history
            old_data = {}
            mapper = object_mapper(obj)
            for attr in mapper.column_attrs:
                history = attr.history
                if history.has_changes():
                    old_data[attr.key] = history.deleted[0] if history.deleted else None
                else:
                    old_data[attr.key] = getattr(obj, attr.key)
            new_data = _serialize_row(obj)
            _write_audit_log(
                session, "UPDATE", obj, old_data=old_data, new_data=new_data
            )

        # Handle deleted objects
        for obj in session.deleted:
            if not _is_auditable(obj):
                continue
            old_data = _serialize_row(obj)
            _write_audit_log(session, "DELETE", obj, old_data=old_data)
