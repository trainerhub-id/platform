import { Hono } from 'hono'
import { z } from 'zod'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import { errorResponse } from '../common/errors'
import { PaymentService } from './payment.service'

const checkDuplicateSchema = z.object({ email: z.string().email(), batchSlug: z.string().min(1) })
const createRegistrationSchema = z.object({
  email: z.string().email(),
  whatsapp: z.string().min(10).max(20),
  batchSlug: z.string().min(1),
  tierSlug: z.string().min(1),
  paymentMethod: z
    .enum(['qris', 'va', 'invoice', 'ovo', 'dana', 'shopeepay', 'linkaja', 'gopay'])
    .default('qris'),
  subPaymentMethod: z
    .enum(['BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI', 'BJB', 'CIMB', 'SAHABAT_SAMPOERNA'])
    .optional()
    .nullable(),
})
const createTierSchema = z.object({
  tierTemplateId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().int().positive(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  courseIds: z.array(z.string()).optional().nullable(),
  aiFeatures: z.array(z.string()).optional().nullable(),
  benefits: z.array(z.string()).optional().nullable(),
  scalevStoreUniqueId: z.string().min(1).optional().nullable(),
  scalevVariantUniqueId: z.string().min(1).optional().nullable(),
  scalevBundlePriceOptionUniqueId: z.string().min(1).optional().nullable(),
})
const updateTierSchema = createTierSchema.partial()

type PaymentServiceLike = Pick<
  PaymentService,
  | 'getPublicBatchInfo'
  | 'getPublicTierInfo'
  | 'checkDuplicate'
  | 'createRegistration'
  | 'getPaymentSessionCheckout'
  | 'refreshScalevPaymentStatus'
  | 'claimPayment'
  | 'getScalevStores'
  | 'getTiersByBatch'
  | 'createTier'
  | 'updateTier'
  | 'deleteTier'
  | 'resyncTierWithScalev'
  | 'getResolvedTier'
  | 'getPaymentsByBatch'
>

export function createPaymentRoutes(service: PaymentServiceLike = new PaymentService()) {
  const app = new Hono<{ Variables: AuthVariables & { requestId: string } }>()

  app.get('/public/batches/:batchSlug/tiers', async (c) =>
    c.json(await service.getPublicBatchInfo(c.req.param('batchSlug'))),
  )
  app.get('/public/batches/:batchSlug/tiers/:tierSlug', async (c) =>
    c.json(await service.getPublicTierInfo(c.req.param('batchSlug'), c.req.param('tierSlug'))),
  )

  app.post('/public/register/check-duplicate', async (c) => {
    const parsed = checkDuplicateSchema.safeParse(await c.req.json())
    if (!parsed.success)
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        parsed.error.issues.map((issue) => issue.message).join('; '),
      )
    return c.json(await service.checkDuplicate(parsed.data))
  })

  app.post('/public/register', async (c) => {
    const parsed = createRegistrationSchema.safeParse(await c.req.json())
    if (!parsed.success)
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        parsed.error.issues.map((issue) => issue.message).join('; '),
      )
    return c.json(await service.createRegistration(parsed.data))
  })

  app.get('/public/payment/session/:sessionId', async (c) =>
    c.json(await service.getPaymentSessionCheckout(c.req.param('sessionId'), c.req.query('token'))),
  )
  app.post('/public/payment/session/:sessionId/check', async (c) =>
    c.json(
      await service.refreshScalevPaymentStatus(
        c.req.param('sessionId'),
        c.req.query('token'),
        true,
      ),
    ),
  )
  app.get('/public/payment/claim/:sessionId', async (c) =>
    c.json(await service.claimPayment(c.req.param('sessionId'), c.req.query('token'))),
  )

  app.get('/admin/scalev/stores', requireAuth, requireRole(['admin']), async (c) =>
    c.json(await service.getScalevStores()),
  )
  app.get('/admin/batches/:batchId/tiers', requireAuth, requireRole(['admin']), async (c) =>
    c.json({ tiers: await service.getTiersByBatch(c.req.param('batchId')) }),
  )
  app.post('/admin/batches/:batchId/tiers', requireAuth, requireRole(['admin']), async (c) => {
    const parsed = createTierSchema.safeParse(await c.req.json())
    if (!parsed.success)
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        parsed.error.issues.map((issue) => issue.message).join('; '),
      )
    return c.json({ tier: await service.createTier(c.req.param('batchId'), parsed.data) }, 201)
  })
  app.patch(
    '/admin/batches/:batchId/tiers/:tierId',
    requireAuth,
    requireRole(['admin']),
    async (c) => {
      const parsed = updateTierSchema.safeParse(await c.req.json())
      if (!parsed.success)
        return errorResponse(
          c,
          400,
          'VALIDATION_ERROR',
          parsed.error.issues.map((issue) => issue.message).join('; '),
        )
      return c.json({ tier: await service.updateTier(c.req.param('tierId'), parsed.data) })
    },
  )
  app.post(
    '/admin/batches/:batchId/tiers/:tierId/resync-scalev',
    requireAuth,
    requireRole(['admin']),
    async (c) => c.json({ tier: await service.resyncTierWithScalev(c.req.param('tierId')) }),
  )
  app.get(
    '/admin/batches/:batchId/tiers/:tierId/resolved',
    requireAuth,
    requireRole(['admin']),
    async (c) => c.json(await service.getResolvedTier(c.req.param('tierId'))),
  )
  app.delete(
    '/admin/batches/:batchId/tiers/:tierId',
    requireAuth,
    requireRole(['admin']),
    async (c) => c.json(await service.deleteTier(c.req.param('tierId'))),
  )
  app.get('/admin/batches/:batchId/payments', requireAuth, requireRole(['admin']), async (c) =>
    c.json({ payments: await service.getPaymentsByBatch(c.req.param('batchId')) }),
  )

  return app
}
