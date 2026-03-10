# create-fastapi-react

Scaffold a full-stack FastAPI + React app with auth, infrastructure, and CI.

## Usage

```bash
# Via npm (recommended)
bunx create-fastapi-react

# Via PyPI
uvx create-fastapi-react

# Non-interactive
bunx create-fastapi-react --name my-app --quiet
```

## What You Get

- **Backend**: FastAPI + SQLAlchemy + SQLite + Alembic + Ruff
- **Frontend**: React 19 + Vite + Tailwind v4 + shadcn/ui + Biome
- **Auth**: Email/password with cookie sessions (or magic-link)
- **Infra**: Docker + Caddy + Litestream + Digital Ocean cloud-init
- **CI**: GitHub Actions (lint + test + build)

## Options

| Flag | Description |
|------|-------------|
| `-n, --name <name>` | Project name |
| `-t, --title <title>` | App title (default: derived from name) |
| `-a, --auth <type>` | `password` or `magic-link` (default: password) |
| `--skip-install` | Skip dependency installation |
| `-q, --quiet` | Suppress output |

## Scaffolded Structure

```
my-app/
  backend/           FastAPI + SQLAlchemy + Alembic
  frontend/          React 19 + Vite + Tailwind v4 + shadcn
  infra/             DO droplet provisioning + deploy scripts
  .github/workflows/ CI: lint, test, build
  Dockerfile         Multi-stage production build
  docker-compose.yml App + Litestream sidecar
  Caddyfile          Reverse proxy with auto TLS
```
