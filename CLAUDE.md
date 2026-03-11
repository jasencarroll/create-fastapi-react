# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Full-stack project template scaffolded via `bunx tiged`. Not a CLI — the repo itself is the template. Includes magic-link auth, Part 11 audit trail, and 100% test coverage.

## Build & Development

### Backend (Python / FastAPI)
```bash
cd backend
uv sync                                                    # Install dependencies
uv run uvicorn app.main:app --reload --port 8000           # Dev server
uv run pytest                                              # All tests (100% coverage enforced)
uv run pytest tests/test_auth.py -k test_login             # Single test
uv run pytest --no-cov                                     # Skip coverage check
uv run ruff check .                                        # Lint
uv run ruff format .                                       # Format
uv run ty check                                            # Type check
uv run alembic upgrade head                                # Run migrations
uv run alembic revision --autogenerate -m "description"    # New migration
```

### Frontend (React / Vite)
```bash
cd frontend
bun install          # Install dependencies
bun run dev          # Dev server on :5173
bun run build        # Production build
bun run test         # Unit tests (Vitest)
bun run test:coverage # Unit tests with 100% coverage enforced
bun run lint         # Biome lint
bun run format       # Biome format
```

### E2E Tests (Playwright, from root)
```bash
bun run test:e2e     # Runs against local dev servers (auto-started)
```

### Both (from root)
```bash
bun run dev          # Start backend + frontend concurrently
```

## Architecture

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Alembic, Python 3.11+
- **Frontend**: React 19 + Vite 7 + Tailwind v4 + shadcn/ui + React Router 7
- **Auth**: Magic link (passwordless email), cookie-based sessions (SHA-256 hashed tokens)
- **Audit**: Part 11 compliant audit trail (AuditMixin + AuditLog append-only table)
- **API**: All endpoints under `/api/` prefix, proxied from Vite in dev

### Key Backend Structure
- `app/main.py` — FastAPI app, CORS, lifespan, static file serving (SPA catch-all in production)
- `app/config.py` — Pydantic Settings (reads `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` from env)
- `app/database.py` — SQLAlchemy engine + session factory
- `app/models.py` — SQLAlchemy models (`User`, `Session`, `MagicLink`). Timestamps are Unix epoch integers.
- `app/audit.py` — Part 11 audit trail (AuditMixin, AuditLog, event listeners, actor tracking)
- `app/schemas.py` — Pydantic request/response schemas
- `app/dependencies.py` — FastAPI dependencies (`get_current_user`)
- `app/lib/auth.py` — Magic link creation/validation, session management
- `app/routes/` — Route modules (`auth.py`: send-magic-link/verify/logout/me, `health.py`: health check)

### Key Frontend Structure
- `src/App.tsx` — Routes: `/`, `/auth`, `/dashboard`
- `src/hooks/useAuth` — Auth context + hook
- `src/pages/` — Page components
- `src/lib/api.ts` — API helpers (`apiGet`, `apiPost`, `apiDelete`)
- `src/components/` — Header, ProtectedRoute, shadcn/ui components

## Template Defaults

These placeholder values are replaced by `setup.sh`:
- `my-app` — project name (kebab-case)
- `My App` — display title
- `change-me-run-setup-sh` — secret key

## Environment

Required in `.env`: `DATABASE_URL`, `SECRET_KEY`, `RESEND_API_KEY`
Optional: `CORS_ORIGINS`, `APP_URL`

## Deployment

Railway via Dockerfile (multi-stage: Bun builds frontend, uv runs backend). Port: `${PORT:-8000}`. Local dev with `docker-compose.yml` (includes PostgreSQL service).

## Pre-commit Hooks

Git is configured to use `.githooks/` (`core.hooksPath`). After cloning, run: `git config core.hooksPath .githooks`

- **pre-commit**: ruff (check + format --check), ty (type check), biome check
- **pre-push**: pytest (backend), vitest with coverage (frontend), vite build, Playwright E2E

## Linting Config

- **Ruff**: line-length 88, selects E/F/I/UP/B/SIM. B008 suppressed in routes and dependencies. Isort knows `app` as first-party.
- **ty**: Astral's type checker. Models use SQLAlchemy 2.0 `Mapped`/`mapped_column` style for type safety.
- **Coverage**: 100% enforced on both backend (pytest-cov `--cov-fail-under=100`) and frontend (vitest v8 thresholds). shadcn/ui components (`src/components/ui/`) and `main.tsx` are excluded from frontend coverage.
- **Biome**: `biome check .` for lint, `biome check --write .` for format.
- **Playwright**: E2E tests in `e2e/` directory, runs against local dev servers. Chromium only. Skipped in CI, runs in pre-push hook.
