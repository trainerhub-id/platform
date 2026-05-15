#!/usr/bin/env bash
set -euo pipefail

ALLOW_DIRTY=0
SKIP_BUILD=0

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-hono.sh [--allow-dirty] [--skip-build]

Deploy Hono stack for hono.sertifikasitrainer.com from the current checkout.

Options:
  --allow-dirty   Allow deploy from a dirty worktree (useful for worktree testing).
  --skip-build    Skip frontend/backend build steps.
  -h, --help      Show this help.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

log() {
  printf '\n[%s] %s\n' "$(date +'%Y-%m-%d %H:%M:%S')" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

require_cmd git
require_cmd bun
require_cmd pm2
require_cmd rsync

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"
BACKEND_DIR="$PROJECT_ROOT/apps/backend-hono"
FRONTEND_DIST="$FRONTEND_DIR/dist"
FRONTEND_TARGET="/var/www/trainerbiz-clean/frontend"
PM2_APP_NAME="trainerhub-hono-backend"
PM2_CONFIG="$PROJECT_ROOT/deploy/pm2/backend-hono-beta.config.cjs"

cd "$PROJECT_ROOT"

if [[ "$ALLOW_DIRTY" -ne 1 ]] && ! git diff --quiet --ignore-submodules -- .; then
  echo "Worktree has uncommitted changes. Re-run with --allow-dirty to deploy anyway." >&2
  git status --short >&2
  exit 1
fi

if [[ "$ALLOW_DIRTY" -ne 1 ]] && ! git diff --cached --quiet --ignore-submodules -- .; then
  echo "Index has staged changes. Re-run with --allow-dirty to deploy anyway." >&2
  git status --short >&2
  exit 1
fi

log "Deploying Hono from $PROJECT_ROOT"
log "Frontend target: $FRONTEND_TARGET"
log "PM2 app: $PM2_APP_NAME (port 3740)"

if [[ "$SKIP_BUILD" -ne 1 ]]; then
  log "Installing workspace dependencies"
  bun install

  log "Building frontend"
  (cd "$FRONTEND_DIR" && bun run build)

  log "Building backend"
  (cd "$BACKEND_DIR" && bun run build)
else
  log "Skipping build steps"
fi

if [[ ! -d "$FRONTEND_DIST" ]]; then
  echo "Frontend dist not found: $FRONTEND_DIST" >&2
  exit 1
fi

log "Creating frontend target"
sudo mkdir -p "$FRONTEND_TARGET"

log "Deploying frontend dist to $FRONTEND_TARGET"
sudo rsync -a --delete "$FRONTEND_DIST"/ "$FRONTEND_TARGET"/

log "Starting/reloading backend with PM2"
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  current_cwd="$(pm2 jlist | node -e "const fs=require('fs'); const app=JSON.parse(fs.readFileSync(0,'utf8')).find(a=>a.name===process.argv[1]); process.stdout.write(app?.pm2_env?.pm_cwd || '')" "$PM2_APP_NAME")"
  if [[ "$current_cwd" != "$BACKEND_DIR" ]]; then
    log "PM2 app cwd changed from ${current_cwd:-<empty>} to $BACKEND_DIR; recreating app"
    pm2 delete "$PM2_APP_NAME"
    pm2 start "$PM2_CONFIG" --only "$PM2_APP_NAME" --update-env
  else
    pm2 reload "$PM2_CONFIG" --only "$PM2_APP_NAME" --update-env
  fi
else
  pm2 start "$PM2_CONFIG" --only "$PM2_APP_NAME" --update-env
fi

log "Saving PM2 process list"
pm2 save

log "Deployment complete"
pm2 status "$PM2_APP_NAME"
