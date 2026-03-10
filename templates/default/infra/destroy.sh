#!/usr/bin/env bash
set -euo pipefail

DROPLET_NAME="${1:-{{projectName}}}"

echo "This will DESTROY the droplet: $DROPLET_NAME"
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

doctl compute droplet delete "$DROPLET_NAME" --force
echo "Droplet $DROPLET_NAME destroyed."
