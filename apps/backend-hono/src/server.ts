import { createApp } from './app'
import { logger } from './common/logger'
import { env } from './config/env'

const app = createApp()

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
})

logger.info({ port: env.PORT }, 'trainerhub-backend-hono started')
