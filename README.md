# create-fastapi-react

Full-stack project template: FastAPI + React with magic-link auth, audit trail, and CI.

## Usage

```bash
bunx tiged jasencarroll/create-fastapi-react my-project
cd my-project
./setup.sh
```

The setup script derives the project name from the directory, generates a secret key, installs dependencies, creates the PostgreSQL database, runs migrations, and initializes git.

**Prerequisites**: [uv](https://docs.astral.sh/uv/), [Bun](https://bun.sh/), PostgreSQL running locally.

## What You Get

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Alembic + Ruff
- **Frontend**: React 19 + Vite + Tailwind v4 + shadcn/ui + Biome
- **Auth**: Magic-link (passwordless email) with cookie sessions
- **Audit**: Part 11 compatible audit trail with before/after JSON capture
- **Deploy**: Dockerfile + Railway
- **CI**: GitHub Actions (lint + test + build)

## Project Structure

```
my-project/
  backend/              FastAPI + SQLAlchemy + Alembic
    app/
      main.py           FastAPI app, CORS, static serving
      config.py         Pydantic Settings
      database.py       SQLAlchemy engine + session
      models.py         User + Session + MagicLink tables
      audit.py          Part 11 audit trail (AuditMixin + AuditLog)
      routes/auth.py    send-magic-link, verify, logout, me
      lib/auth.py       Magic link + session management
    alembic/            Database migrations
    tests/

  frontend/             React 19 + Vite + Tailwind v4 + shadcn
    src/
      App.tsx           Routes: /, /auth, /auth/verify, /dashboard
      hooks/useAuth.tsx Auth context + hook
      pages/            Home, Auth, Dashboard
      lib/api.ts        API helpers (apiGet, apiPost, apiDelete)
      components/       Header, ProtectedRoute, shadcn/ui

  Dockerfile            Multi-stage: Bun builds frontend, uv runs backend
  docker-compose.yml    App + PostgreSQL (local dev)
  railway.json          DOCKERFILE builder + health check
  .github/workflows/    CI: backend-lint, backend-test, frontend-lint, frontend-build
```

## Development

```bash
bun run dev                              # Start both servers
cd backend && uv run pytest              # Backend tests
cd frontend && bun run build             # Frontend build
cd backend && uv run ruff check .        # Backend lint
cd frontend && bun run lint              # Frontend lint
```

## Deploy

Push to GitHub with `railway.json` — Railway auto-deploys via Dockerfile. Set env vars in the Railway dashboard:

- `DATABASE_URL` — Railway Postgres plugin provides this
- `SECRET_KEY` — generate with `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `CORS_ORIGINS` — e.g. `["https://your-domain.com"]`
- `APP_URL` — your production URL (e.g. `https://your-domain.com`)
- `RESEND_API_KEY` — from [Resend](https://resend.com)
