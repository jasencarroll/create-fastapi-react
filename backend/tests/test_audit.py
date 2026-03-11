import json

from app.audit import (
    AuditLog,
    _get_primary_key,
    _is_auditable,
    _serialize_row,
    _stamp_actor,
    current_actor_id,
    register_audit_listeners,
)
from app.lib.auth import generate_user_id
from app.models import MagicLink, Session, User


def test_audit_log_on_insert(db):
    user = User(id=generate_user_id(), email="audit@example.com")
    db.add(user)
    db.commit()

    logs = db.query(AuditLog).filter(AuditLog.table_name == "user").all()
    assert len(logs) == 1
    assert logs[0].action == "INSERT"
    assert logs[0].old_data is None
    new_data = json.loads(logs[0].new_data)
    assert new_data["email"] == "audit@example.com"


def test_audit_log_on_update(db):
    user = User(id=generate_user_id(), email="before@example.com")
    db.add(user)
    db.commit()

    user.email = "after@example.com"
    db.commit()

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.table_name == "user", AuditLog.action == "UPDATE")
        .all()
    )
    assert len(logs) == 1
    new_data = json.loads(logs[0].new_data)
    assert new_data["email"] == "after@example.com"
    # old_data captures the previous state
    old_data = json.loads(logs[0].old_data)
    assert "email" in old_data


def test_audit_log_on_delete(db):
    user = User(id=generate_user_id(), email="delete@example.com")
    db.add(user)
    db.commit()

    db.delete(user)
    db.commit()

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.table_name == "user", AuditLog.action == "DELETE")
        .all()
    )
    assert len(logs) == 1
    old_data = json.loads(logs[0].old_data)
    assert old_data["email"] == "delete@example.com"


def test_audit_skips_session_table(db):
    user = User(id=generate_user_id(), email="session@example.com")
    db.add(user)
    db.commit()

    session = Session(id="test-session", user_id=user.id, expires_at=2000000000)
    db.add(session)
    db.commit()

    logs = db.query(AuditLog).filter(AuditLog.table_name == "session").all()
    assert len(logs) == 0


def test_audit_skips_audit_log_table(db):
    assert not _is_auditable(AuditLog(table_name="audit_log"))


def test_audit_skips_magic_link_table(db):
    assert not _is_auditable(MagicLink(id="x", email="x@x.com", expires_at=0))


def test_stamp_actor_sets_created_by(db):
    token = current_actor_id.set("actor-123")
    try:
        user = User(id=generate_user_id(), email="stamped@example.com")
        _stamp_actor(user)
        assert user.created_by == "actor-123"
        assert user.updated_by == "actor-123"
    finally:
        current_actor_id.reset(token)


def test_stamp_actor_skips_when_no_actor(db):
    user = User(id=generate_user_id(), email="nostamp@example.com")
    _stamp_actor(user)
    assert user.created_by is None


def test_serialize_row(db):
    user = User(id="test-id", email="ser@example.com")
    db.add(user)
    db.commit()
    data = _serialize_row(user)
    assert data["id"] == "test-id"
    assert data["email"] == "ser@example.com"


def test_get_primary_key(db):
    user = User(id="pk-test", email="pk@example.com")
    db.add(user)
    db.commit()
    assert _get_primary_key(user) == "pk-test"


def test_actor_id_recorded_in_audit_log(db):
    # Create the actor user first (FK constraint on audit_log.actor_id)
    actor = User(id="actor-real", email="actor@example.com")
    db.add(actor)
    db.commit()

    token = current_actor_id.set("actor-real")
    try:
        user = User(id=generate_user_id(), email="tracked@example.com")
        db.add(user)
        db.commit()
    finally:
        current_actor_id.reset(token)

    log = (
        db.query(AuditLog)
        .filter(
            AuditLog.table_name == "user",
            AuditLog.record_id != "actor-real",
        )
        .first()
    )
    assert log.actor_id == "actor-real"


def test_register_audit_listeners_idempotent():
    # Should not raise when called multiple times
    register_audit_listeners()
