#!/usr/bin/env bash
set -euo pipefail

# Deploy via Docker over SSH
# Usage: ./infra/deploy.sh <host>

HOST="${1:-}"
if [ -z "$HOST" ]; then
    echo "Usage: ./infra/deploy.sh <host-or-ip>"
    exit 1
fi

USER="${DEPLOY_USER:-deploy}"
APP_DIR="/home/$USER/app"

echo "Deploying to $USER@$HOST..."

# Build Docker image locally
echo "Building Docker image..."
docker build -t {{projectName}}:latest .

# Save and transfer image
echo "Transferring image..."
docker save {{projectName}}:latest | gzip | ssh "$USER@$HOST" "docker load"

# Transfer config files
echo "Transferring config files..."
scp docker-compose.yml "$USER@$HOST:$APP_DIR/"
scp Caddyfile "$USER@$HOST:$APP_DIR/"
scp .env "$USER@$HOST:$APP_DIR/"
scp -r infra/litestream.yml "$USER@$HOST:$APP_DIR/infra/"

# Restart services
echo "Restarting services..."
ssh "$USER@$HOST" "cd $APP_DIR && docker compose up -d --remove-orphans"

echo ""
echo "Deployed successfully!"
