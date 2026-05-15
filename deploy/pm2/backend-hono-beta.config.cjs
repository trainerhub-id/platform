const path = require('node:path');

const projectDir = path.resolve(__dirname, '../..');
const passThroughEnv = ['DATABASE_URL', 'DEEPSEEK_API_KEY', 'DEEPSEEK_BASE_URL', 'AI_PROVIDER', 'AI_MODEL']
  .reduce((env, key) => {
    if (process.env[key]) env[key] = process.env[key];
    return env;
  }, {});

module.exports = {
  apps: [
    {
      name: 'trainerhub-beta-backend',
      cwd: path.join(projectDir, 'apps/backend-hono'),
      script: 'src/server.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: '3739',
        FRONTEND_URL: 'https://hono.sertifikasitrainer.com',
        BETTER_AUTH_URL: 'https://hono.sertifikasitrainer.com/api/auth',
        ...passThroughEnv,
      },
    },
  ],
};
