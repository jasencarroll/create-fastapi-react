# create-fastapi-react

Full-stack project template scaffolded via `bunx tiged`. Not a CLI — the repo itself is the template.

## Usage

```bash
bunx tiged jasencarroll/create-fastapi-react my-project
cd my-project
./setup.sh               # Derives name from directory, generates secret, installs deps, inits git
```

Magic-link variant: `bunx tiged jasencarroll/create-fastapi-react#magic-link my-project`

## Build & Development

### Backend (Python / FastAPI)
```bash
cd backend
uv sync              # Install dependencies
uv run uvicorn app.main:app --reload --port 8000
uv run pytest        # Run tests
uv run ruff check .  # Lint
uv run ruff format . # Format
uv run alembic upgrade head     # Run migrations
uv run alembic revision --autogenerate -m "description"  # New migration
```

### Frontend (React / Vite)
```bash
cd frontend
bun install          # Install dependencies
bun run dev          # Dev server on :5173
bun run build        # Production build
bun run lint         # Biome lint
bun run format       # Biome format
```

### Both (from root)
```bash
bun run dev          # Start backend + frontend concurrently
```

## Architecture

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Alembic
- **Frontend**: React 19 + Vite + Tailwind v4 + shadcn/ui
- **Auth**: Cookie-based sessions (SHA-256 hashed tokens, PBKDF2 passwords)
- **API**: All endpoints under `/api/` prefix, proxied from Vite in dev

## Key Directories

```
backend/
  app/main.py          # FastAPI app, CORS, lifespan, static serving
  app/config.py        # Pydantic Settings
  app/database.py      # SQLAlchemy engine + session
  app/models.py        # User + Session tables
  app/routes/auth.py   # register, login, logout, me
  app/routes/health.py # Health check
  app/lib/auth.py      # Password hashing, session management
  app/dependencies.py  # get_current_user
  alembic/             # Database migrations

frontend/
  src/App.tsx          # Routes: /, /auth, /dashboard
  src/hooks/useAuth    # Auth context + hook
  src/pages/           # Home, Auth, Dashboard
  src/lib/api.ts       # API helpers (apiGet, apiPost, apiDelete)
  src/lib/utils.ts     # cn() utility
  src/components/      # Header, ProtectedRoute, shadcn/ui
```

## Template Defaults

These placeholder values are replaced by `setup.sh`:
- `my-app` — project name (kebab-case)
- `My App` — display title
- `change-me-run-setup-sh` — secret key

## Database

PostgreSQL with SQLAlchemy. Timestamps are Unix epoch integers.

Tables: `user` (id, email, password_hash, created_at, updated_at), `session` (id, user_id, expires_at)

## Environment

Required in `.env`: `DATABASE_URL`, `SECRET_KEY`
Optional: `CORS_ORIGINS`

## Deployment (Railway)

- `railway.json` - DOCKERFILE builder + health check config
- `Dockerfile` - Multi-stage: Bun builds frontend, uv runs backend, `${PORT:-8000}`
- `docker-compose.yml` - Local dev with PostgreSQL service
