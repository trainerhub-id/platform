# Repo Instructions

## Hono deploy on this machine

- When working in the `hono` branch/worktree, the live target is `hono.sertifikasitrainer.com`.
- Do not refer to the Hono target as "beta" in user-facing status or final answers. The filesystem path and PM2 process may still contain `trainerhub-beta`, but the product/deploy target is Hono.
- Do not claim a Hono change is "done", "fixed", "live", or "deployed" until both of these are true:
  - `./scripts/deploy-hono.sh` has completed successfully from the repo root.
  - Live Hono verification has been run against `https://hono.sertifikasitrainer.com` (for example `curl https://hono.sertifikasitrainer.com/api/health` plus a Playwright or browser check for the affected route).
- If only local dev server verification was run, say "verified locally" and explicitly say it has not been verified on Hono.
- Do not use `bun run deploy:preview`, Wrangler, or Cloudflare Workers deployment for Hono unless the user explicitly asks to work on the Workers path.

## Hono infra references

- Frontend static root: `/var/www/trainerhub-beta/frontend`
- Backend PM2 app: `trainerhub-beta-backend`
- Backend PM2 config: `deploy/pm2/backend-hono-beta.config.cjs`
- Nginx Hono site config: `deploy/nginx/hono.sertifikasitrainer.com.conf`
- Deploy script: `./scripts/deploy-hono.sh`
- Smoke script: `./scripts/smoke-beta-hono.sh` (name is legacy; target defaults to Hono)
