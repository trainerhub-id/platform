#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$PROJECT_DIR/apps/frontend"
BACKEND_DIR="$PROJECT_DIR/apps/backend-hono"
FRONTEND_TARGET="/var/www/trainerhub-beta/frontend"
PM2_APP_NAME="trainerhub-beta-backend"
PM2_CONFIG="$PROJECT_DIR/deploy/pm2/backend-hono-beta.config.cjs"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

require_dir() {
  local dir="$1"
  if [[ ! -d "$dir" ]]; then
    echo "Directory not found: $dir" >&2
    exit 1
  fi
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Command not found: $cmd" >&2
    exit 1
  fi
}

require_dir "$PROJECT_DIR"
require_dir "$FRONTEND_DIR"
require_dir "$BACKEND_DIR"
require_dir "$FRONTEND_TARGET"
require_cmd bun
require_cmd pm2
require_cmd rsync
require_cmd jq

hydrate_env_from_pm2() {
  local keys=(
    DATABASE_URL
    BETTER_AUTH_SECRET
    BETTER_AUTH_URL
    FRONTEND_URL
    DEEPSEEK_API_KEY
    SCALEV_API_KEY
    SCALEV_BASE_URL
    SCALEV_WEBHOOK_SECRET
    S3_ENDPOINT
    S3_REGION
    S3_BUCKET
    S3_ACCESS_KEY_ID
    S3_SECRET_ACCESS_KEY
    S3_PUBLIC_URL
  )

  for key in "${keys[@]}"; do
    if [[ -n "${!key:-}" ]]; then
      continue
    fi

    local value
    value="$(pm2 jlist | jq -r --arg app "$PM2_APP_NAME" --arg key "$key" '.[] | select(.name == $app) | .pm2_env[$key] // empty' | head -n 1)"
    if [[ -n "$value" ]]; then
      export "$key=$value"
    fi
  done
}

log "Installing workspace dependencies"
cd "$PROJECT_DIR"
bun install

log "Loading PM2 environment for verification and reload"
hydrate_env_from_pm2

log "Building frontend"
cd "$FRONTEND_DIR"
bun run build

log "Syncing frontend dist to $FRONTEND_TARGET"
rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_TARGET/"

log "Verifying Hono backend"
cd "$BACKEND_DIR"
bun run typecheck
bun test
bun run build

log "Reloading PM2 app: $PM2_APP_NAME"
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_CONFIG" --only "$PM2_APP_NAME" --update-env
else
  pm2 start "$PM2_CONFIG"
fi

log "Saving PM2 process list"
pm2 save

log "Deployment complete"
pm2 status "$PM2_APP_NAME"
