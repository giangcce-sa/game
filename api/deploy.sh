#!/bin/bash
# Deploy API backend to VPS
# Usage: ./api/deploy.sh your-anthropic-key

set -e

VPS="quyetluu05@35.240.135.21"
SSH_KEY="~/.ssh/google_ai_annhuspa"
REMOTE_DIR="/opt/english-game-api"
ANTHROPIC_KEY="${1:-$ANTHROPIC_API_KEY}"

if [ -z "$ANTHROPIC_KEY" ]; then
  echo "Error: Pass ANTHROPIC_API_KEY as argument: ./deploy.sh sk-ant-..."
  exit 1
fi

echo "📦 Deploying API to VPS..."

# Create remote directory and copy files
ssh -i $SSH_KEY $VPS "mkdir -p $REMOTE_DIR"
rsync -avz -e "ssh -i $SSH_KEY" api/server.js api/package.json api/Dockerfile $VPS:$REMOTE_DIR/

# Create docker-compose on server with the API key
ssh -i $SSH_KEY $VPS "cat > $REMOTE_DIR/docker-compose.yml" << COMPOSE
services:
  english-game-api:
    build: .
    container_name: english-game-api
    restart: unless-stopped
    environment:
      - ANTHROPIC_API_KEY=$ANTHROPIC_KEY
    networks:
      - internal-ai-gateway_default
networks:
  internal-ai-gateway_default:
    external: true
COMPOSE

# Build and start
ssh -i $SSH_KEY $VPS "cd $REMOTE_DIR && docker compose build && docker compose up -d"
echo "✅ API deployed at http://english-game-api:3001 (internal network)"
echo ""
echo "Next: Add to Caddy config (/opt/internal-ai-gateway/Caddyfile):"
echo '  handle_path /api/* {'
echo '    reverse_proxy english-game-api:3001'
echo '  }'
echo ""
echo "Then reload: ssh $VPS 'docker exec caddy caddy reload --config /etc/caddy/Caddyfile'"
