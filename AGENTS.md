# Repo Instructions

## Beta deploy on this machine

- Do not assume `beta.sertifikasitrainer.com` uses Cloudflare Workers or Wrangler deployment.
- The actual beta deployment flow on this machine is local:
  - Frontend build output is synced to `/var/www/trainerhub-beta/frontend`
  - Backend runs under PM2 as `trainerhub-beta-backend`
- For beta deployment, use `./scripts/deploy-beta.sh` from the repo root.
- Do not use `bun run deploy:preview` or Wrangler for beta unless the user explicitly asks to work on the Workers path.

## Beta infra references

- Frontend static root: `/var/www/trainerhub-beta/frontend`
- Backend PM2 config: `deploy/pm2/backend-beta.config.cjs`
- Nginx beta site config: `deploy/nginx/beta.sertifikasitrainer.com.conf`
