import { PgBoss } from 'pg-boss'
import { createApp } from './app'
import { logger } from './common/logger'
import { env } from './config/env'
import { GenerationJobService } from './generation/generation-job.service'
import { GenerationWorkerService, generationWorkerJobNames } from './generation/generation-worker.service'

const boss = new PgBoss({
  connectionString: env.DATABASE_URL.replace(/[?&]channel_binding=[^&]*/g, '').replace(/\?$/, ''),
  schema: env.PGBOSS_SCHEMA,
})
const generationJobs = new GenerationJobService({ boss })
const app = createApp({ generationJobs })

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
})

logger.info({ port: env.PORT }, 'trainerhub-backend-hono started')

// Start generation worker — create queues first, then register workers
boss.start()
  .then(async () => {
    for (const name of generationWorkerJobNames) {
      await boss.createQueue(name).catch(() => { /* already exists */ })
    }
    const worker = new GenerationWorkerService({ boss })
    await worker.start()
    logger.info('Generation worker started')
  })
  .catch((err) => logger.error({ err }, 'Generation worker failed to start'))
