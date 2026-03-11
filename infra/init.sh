#!/usr/bin/env bash
set -euo pipefail

# Create a Digital Ocean droplet with cloud-init
# Requires: doctl, SSH key added to DO account

DROPLET_NAME="${1:-my-app}"
REGION="${DO_REGION:-nyc3}"
SIZE="${DO_SIZE:-s-1vcpu-1gb}"
IMAGE="${DO_IMAGE:-ubuntu-24-04-x64}"

# Get SSH key fingerprint
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header | head -1)
if [ -z "$SSH_KEY_ID" ]; then
    echo "Error: No SSH key found in your DO account."
    echo "Add one: doctl compute ssh-key create my-key --public-key-file ~/.ssh/id_ed25519.pub"
    exit 1
fi

echo "Creating droplet: $DROPLET_NAME ($SIZE in $REGION)"

doctl compute droplet create "$DROPLET_NAME" \
    --region "$REGION" \
    --size "$SIZE" \
    --image "$IMAGE" \
    --ssh-keys "$SSH_KEY_ID" \
    --user-data-file infra/cloud-init.yml \
    --wait

IP=$(doctl compute droplet get "$DROPLET_NAME" --format PublicIPv4 --no-header)
echo ""
echo "Droplet created: $IP"
echo ""
echo "Next steps:"
echo "  1. Point your domain to $IP"
echo "  2. Wait ~2 min for cloud-init to finish"
echo "  3. Run: bun run infra:deploy"
