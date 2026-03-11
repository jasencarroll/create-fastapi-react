#!/usr/bin/env bash
set -euo pipefail

# Post-clone setup for create-fastapi-react
# Usage: ./setup.sh [project-name]

PROJECT_NAME="${1:-}"

if [ -z "$PROJECT_NAME" ]; then
  read -rp "Project name (kebab-case): " PROJECT_NAME
fi

# Validate
if [ -z "$PROJECT_NAME" ]; then
  echo "Error: Project name is required"
  exit 1
fi

if ! echo "$PROJECT_NAME" | grep -qE '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
  echo "Error: Project name must be lowercase alphanumeric with hyphens"
  exit 1
fi

# Derive app title (kebab-case to Title Case)
APP_TITLE=$(echo "$PROJECT_NAME" | tr '-' '\n' | awk '{print toupper(substr($0,1,1)) substr($0,2)}' | tr '\n' ' ' | sed 's/ $//')

# Generate secret key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")

echo ""
echo "  Project: $PROJECT_NAME"
echo "  Title:   $APP_TITLE"
echo ""

# Replace defaults in all project files
replace() {
  local old="$1" new="$2"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -not -name 'setup.sh' -exec sed -i '' "s|$old|$new|g" {} +
  else
    find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -not -name 'setup.sh' -exec sed -i "s|$old|$new|g" {} +
  fi
}

echo "  Configuring project..."
replace "my-app" "$PROJECT_NAME"
replace "My App" "$APP_TITLE"
replace "change-me-run-setup-sh" "$SECRET_KEY"

# Create .env from .env.example
if [ -f .env.example ]; then
  cp .env.example .env
  chmod 600 .env
fi

# Install dependencies
echo "  Installing backend dependencies..."
(cd backend && uv sync 2>&1) || echo "  Warning: backend install failed. Run 'cd backend && uv sync' manually."

echo "  Installing frontend dependencies..."
(cd frontend && bun install 2>&1) || echo "  Warning: frontend install failed. Run 'cd frontend && bun install' manually."

# Run initial migration
echo "  Running database migration..."
(cd backend && uv run alembic upgrade head 2>&1) || echo "  Skipped — configure DATABASE_URL in .env first."

# Self-destruct
rm -f setup.sh

# Git init
git init -q
git add -A
git commit -q -m "Initial commit from create-fastapi-react"

echo ""
echo "  Done! Your project is ready."
echo ""
echo "  Start development:"
echo "    bun run dev"
echo ""
echo "  Or run separately:"
echo "    cd backend && uv run uvicorn app.main:app --reload"
echo "    cd frontend && bun run dev"
echo ""
