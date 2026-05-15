# TrainerHub Platform

Production-focused TrainerHub workspace with:

- `apps/backend-hono` - Hono API, Better Auth, Drizzle schema/migrations, payment, peserta, batch, todo, kelas, dokumen, certificate, and AI document routes.
- `apps/frontend` - Vite React frontend configured to call the backend through same-origin `/api`.
- `deploy` - PM2 and Nginx config for `hono.sertifikasitrainer.com`.
- `scripts` - local deploy and smoke-test scripts for the Hono deployment.

## Common Commands

```bash
bun install
bun run dev:backend
bun run dev:frontend
bun run typecheck:backend
bun run test:backend
bun run build:backend
bun run build:frontend
```

## Local Hono Deploy

```bash
./scripts/deploy-hono.sh
BASE_URL=https://hono.sertifikasitrainer.com ./scripts/smoke-beta-hono.sh
```

The Hono backend is mounted under `/api`, including auth at `/api/auth/*`.
