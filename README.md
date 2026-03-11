# create-fastapi-react

Full-stack project template: FastAPI + React with auth, infrastructure, and CI.

## Usage

```bash
bunx tiged jasencarroll/create-fastapi-react my-project
cd my-project
./setup.sh my-project
```

The setup script renames the project, generates a secret key, installs dependencies, and initializes git.

### Magic-link auth variant

```bash
bunx tiged jasencarroll/create-fastapi-react#magic-link my-project
cd my-project
./setup.sh my-project
```

## What You Get

- **Backend**: FastAPI + SQLAlchemy + SQLite + Alembic + Ruff
- **Frontend**: React 19 + Vite + Tailwind v4 + shadcn/ui + Biome
- **Auth**: Email/password with cookie sessions (or magic-link)
- **Infra**: Docker + Caddy + Litestream + Digital Ocean cloud-init
- **CI**: GitHub Actions (lint + test + build)

## Project Structure

```
my-project/
  backend/              FastAPI + SQLAlchemy + Alembic
    app/
      main.py           FastAPI app, CORS, static serving
      config.py         Pydantic Settings
      database.py       SQLAlchemy engine + session
      models.py         User + Session tables
      routes/auth.py    register, login, logout, me
      lib/auth.py       Password hashing, session management
    alembic/            Database migrations
    tests/

  frontend/             React 19 + Vite + Tailwind v4 + shadcn
    src/
      App.tsx           Routes: /, /auth, /dashboard
      hooks/useAuth.tsx Auth context + hook
      pages/            Home, Auth, Dashboard
      components/       Header, ProtectedRoute, shadcn/ui

  infra/                Digital Ocean provisioning
    init.sh             Create droplet with cloud-init
    deploy.sh           Docker build + SSH deploy
    cloud-init.yml      UFW, fail2ban, SSH hardening

  Dockerfile            Multi-stage: Bun builds frontend, uv runs backend
  docker-compose.yml    App + Litestream SQLite backup
  Caddyfile             Reverse proxy with auto TLS
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

```bash
bun run infra:init                       # Create DO droplet
# Point domain to droplet IP, wait for cloud-init
bun run infra:deploy <host>              # Docker build + deploy
```
