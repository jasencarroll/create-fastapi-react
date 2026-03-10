# create-fastapi-react

CLI scaffolder that generates full-stack FastAPI + React projects.

## Build & Dev

```bash
bun install          # Install CLI dev dependencies
bun run lint         # Biome lint
bun run test         # Run tests
```

## Architecture

- `cli.ts` - Primary CLI (Bun), interactive + non-interactive modes
- `cli.py` - Python CLI (stdlib only), feature parity with cli.ts
- `utils/template.ts` - Template engine: copies files, replaces `{{var}}` placeholders
- `utils/template.py` - Python equivalent of template engine
- `templates/default/` - Base project template (backend + frontend + infra)
- `templates/magic-link/` - Overlay that replaces auth files for magic-link mode

## Template Variables

- `{{projectName}}` - kebab-case project name
- `{{appTitle}}` - Human-readable title
- `{{secretKey}}` - Random 64-char hex secret

## Testing

```bash
bun test                                          # Unit tests
bunx create-fastapi-react --name test-app --quiet # Integration: scaffold
cd test-app/backend && uv run pytest              # Verify backend
cd test-app/frontend && bun run build             # Verify frontend
```

## Publishing

- npm: `npm publish` (uses package.json bin field)
- PyPI: `uv build && uv publish` (uses pyproject.toml + hatchling)
