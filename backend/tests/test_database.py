import contextlib

from app.database import get_db, init_db


def test_get_db():
    gen = get_db()
    db = next(gen)
    assert db is not None
    with contextlib.suppress(StopIteration):
        next(gen)


def test_init_db():
    # Should not raise — tables already exist from conftest
    init_db()
