import { Hono } from 'hono'
import { z } from 'zod'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import { errorResponse } from '../common/errors'
import { EnrollmentService } from './enrollment.service'

const searchQuerySchema = z.object({
  q: z.string().trim().min(2),
})

type EnrollmentVariables = AuthVariables & { requestId: string }
type EnrollmentServiceLike = Pick<EnrollmentService, 'search' | 'listBatchEnrollments' | 'markPaid'>

export function createEnrollmentRoutes(service: EnrollmentServiceLike = new EnrollmentService()) {
  const app = new Hono<{ Variables: EnrollmentVariables }>()

  app.get('/admin/enrollments/search', requireAuth, requireRole(['admin']), async (c) => {
    const parsed = searchQuerySchema.safeParse({ q: c.req.query('q') })
    if (!parsed.success)
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        parsed.error.issues.map((issue) => issue.message).join('; '),
      )
    return c.json({ results: await service.search(parsed.data.q) })
  })

  app.get('/admin/batches/:batchId/enrollments', requireAuth, requireRole(['admin']), async (c) => {
    return c.json({ enrollments: await service.listBatchEnrollments(c.req.param('batchId')) })
  })

  app.patch(
    '/admin/enrollments/:enrollmentId/mark-paid',
    requireAuth,
    requireRole(['admin']),
    async (c) => {
      return c.json({ enrollment: await service.markPaid(c.req.param('enrollmentId')) })
    },
  )

  return app
}
