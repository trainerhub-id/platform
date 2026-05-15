const path = require('node:path');
const fs = require('node:fs');

const projectRoot = path.resolve(__dirname, '../..');
const mainProjectRoot = projectRoot.includes(`${path.sep}.worktrees${path.sep}`)
  ? projectRoot.slice(0, projectRoot.indexOf(`${path.sep}.worktrees${path.sep}`))
  : projectRoot;
const forwardedEnvKeys = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
  'AI_PROVIDER',
  'AI_MODEL',
  'SCALEV_API_KEY',
  'SCALEV_BASE_URL',
  'SCALEV_WEBHOOK_SECRET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_PUBLIC_URL',
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      }),
  );
}

const fileEnv = {
  ...readEnvFile(path.join(mainProjectRoot, 'apps/backend-hono/.env')),
  ...readEnvFile(path.join(projectRoot, 'apps/backend-hono/.env')),
};

const forwardedEnv = Object.fromEntries(
  forwardedEnvKeys
    .map((key) => [key, process.env[key] ?? fileEnv[key]])
    .filter(([, value]) => value),
);

module.exports = {
  apps: [
    {
      name: 'trainerhub-beta-backend',
      cwd: path.join(projectRoot, 'apps/backend-hono'),
      script: 'src/server.ts',
      interpreter: 'bun',
      env: {
        ...forwardedEnv,
        NODE_ENV: 'production',
        PORT: '3739',
        FRONTEND_URL: 'https://hono.sertifikasitrainer.com',
        FRONTEND_ORIGINS: 'https://hono.sertifikasitrainer.com',
        BETTER_AUTH_URL: 'https://hono.sertifikasitrainer.com/api/auth',
      },
    },
  ],
};
