#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-}"
if [ -z "$HOST" ]; then
    echo "Usage: ./infra/ssh.sh <host-or-ip>"
    exit 1
fi

USER="${DEPLOY_USER:-deploy}"
ssh "$USER@$HOST"
