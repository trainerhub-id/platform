const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const backendDir = path.join(projectRoot, 'apps/backend-hono');
const passThroughEnv = [
  'DATABASE_URL',
  'DEEPSEEK_API_KEY',
  'DEEPSEEK_BASE_URL',
  'AI_PROVIDER',
  'AI_MODEL',
  'BETTER_AUTH_SECRET',
  'JWT_SECRET',
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
].reduce((env, key) => {
  if (process.env[key]) env[key] = process.env[key];
  return env;
}, {});

module.exports = {
  apps: [
    {
      name: 'trainerhub-hono-backend',
      cwd: backendDir,
      script: 'src/server.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: '3740',
        FRONTEND_URL: 'https://hono.sertifikasitrainer.com',
        BETTER_AUTH_URL: 'https://hono.sertifikasitrainer.com/api/auth',
        ...passThroughEnv,
      },
    },
  ],
};
