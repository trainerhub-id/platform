const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const forwardedEnvKeys = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'DEEPSEEK_API_KEY',
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

const forwardedEnv = Object.fromEntries(
  forwardedEnvKeys
    .filter((key) => process.env[key])
    .map((key) => [key, process.env[key]]),
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
        FRONTEND_URL: 'https://beta.sertifikasitrainer.com',
        FRONTEND_ORIGINS: 'https://beta.sertifikasitrainer.com,https://hono.sertifikasitrainer.com',
        BETTER_AUTH_URL: 'https://hono.sertifikasitrainer.com/api/auth',
      },
    },
  ],
};
