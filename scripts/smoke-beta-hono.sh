#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://hono.sertifikasitrainer.com}"

curl -fsS "$BASE_URL/api/health" | grep -q 'trainerhub-backend-hono'
curl -fsS "$BASE_URL/api/openapi.json" | grep -q 'TrainerHub Hono API'
printf 'Hono beta smoke passed\n'
