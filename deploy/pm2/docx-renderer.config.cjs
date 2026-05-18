const path = require('node:path')

const projectRoot = path.resolve(__dirname, '../..')
const rendererDir = path.join(projectRoot, 'apps/docx-renderer')

module.exports = {
  apps: [
    {
      name: 'trainerhub-docx-renderer',
      cwd: rendererDir,
      script: 'src/server.mjs',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: '3741',
      },
    },
  ],
}
