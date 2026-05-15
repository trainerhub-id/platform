const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');

module.exports = {
  apps: [
    {
      name: 'trainerhub-beta-backend',
      cwd: path.join(projectRoot, 'apps/backend-hono'),
      script: 'src/server.ts',
      interpreter: 'bun',
      env: {
        NODE_ENV: 'production',
        PORT: '3739',
        FRONTEND_URL: 'https://hono.sertifikasitrainer.com',
        BETTER_AUTH_URL: 'https://hono.sertifikasitrainer.com/api/auth',
      },
    },
  ],
};
