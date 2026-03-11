import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://localhost/my-app_test"
)


def _ensure_db_exists(url):
    """Create a database if it doesn't exist."""
    from urllib.parse import urlparse, urlunparse

    parsed = urlparse(url)
    db_name = parsed.path.lstrip("/")
    maintenance_url = urlunparse(parsed._replace(path="/postgres"))

    maint_engine = create_engine(maintenance_url, isolation_level="AUTOCOMMIT")
    with maint_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    maint_engine.dispose()


_ensure_db_exists(TEST_DATABASE_URL)

# Also ensure the app database exists (needed by test_database.py which tests init_db)
from app.config import settings  # noqa: E402

_ensure_db_exists(settings.database_url)

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Register audit listeners once for test suite
from app.audit import register_audit_listeners  # noqa: E402

register_audit_listeners()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
