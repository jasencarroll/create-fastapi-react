# {{appTitle}}

Built with [create-fastapi-react](https://github.com/jasencarroll/create-fastapi-react).

## Quick Start

```bash
# Install dependencies
cd backend && uv sync
cd frontend && bun install

# Start development
bun run dev
```

Backend runs on http://localhost:8000, frontend on http://localhost:5173.

## Stack

- **Backend**: FastAPI, SQLAlchemy, SQLite, Alembic, Ruff
- **Frontend**: React 19, Vite, Tailwind v4, shadcn/ui, Biome
- **Auth**: Email + password with cookie sessions
- **Infra**: Docker, Caddy, Litestream, Digital Ocean

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start backend + frontend |
| `cd backend && uv run pytest` | Run backend tests |
| `cd frontend && bun run build` | Build frontend |
| `bun run infra:init` | Create DO droplet |
| `bun run infra:deploy` | Deploy with Docker |

## Deploy

1. Create a Digital Ocean droplet: `bun run infra:init`
2. Point your domain to the droplet IP
3. Configure `.env` with production values
4. Deploy: `bun run infra:deploy <host>`
