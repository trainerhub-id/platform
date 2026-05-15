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

log "Installing workspace dependencies"
cd "$PROJECT_DIR"
bun install

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
