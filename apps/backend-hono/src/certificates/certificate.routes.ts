import { Hono } from 'hono'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import { errorResponse } from '../common/errors'
import type { Workspace } from '../db/schema'
import { requireWorkspace } from '../workspace/workspace.middleware'
import { WorkspaceService } from '../workspace/workspace.service'
import { CertificateService } from './certificate.service'

type CertificateVariables = AuthVariables & { requestId: string; workspace: Workspace }

type CertificateServiceLike = Pick<
  CertificateService,
  | 'validate'
  | 'getMyCertificates'
  | 'getAllMyCertificates'
  | 'getEligibleCourses'
  | 'generateCertificateForUser'
  | 'findById'
  | 'listForWorkspace'
>

type UserWithRole = { id: string; role?: string }

export function createCertificateRoutes(deps: {
  service?: CertificateServiceLike
  workspaceService?: Pick<WorkspaceService, 'findByUserAndSlug'>
} = {}) {
  const service: CertificateServiceLike = deps.service ?? new CertificateService()
  const workspaceService = deps.workspaceService ?? new WorkspaceService()
  const app = new Hono<{ Variables: CertificateVariables }>()
  const workspaceGuard = requireWorkspace(workspaceService)

  // Public validation — no auth needed
  app.get('/certificates/validate/:certificateNumber', async (c) => {
    const result = await service.validate(c.req.param('certificateNumber'))
    if (!result) return errorResponse(c, 404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found')
    return c.json(result)
  })

  // Workspace-scoped sertifikat list
  app.get('/sertifikat/me', requireAuth, requireRole(['peserta']), workspaceGuard, async (c) => {
    const ws = c.get('workspace')
    return c.json(await service.listForWorkspace(ws.id))
  })

  // Legacy / non-workspace-scoped routes (kept for admin and backward compat)
  app.get('/certificates/me', requireAuth, requireRole(['peserta']), async (c) => {
    const user = c.get('user') as UserWithRole
    const certificates = await service.getMyCertificates(user.id)
    return c.json({ certificates })
  })

  app.get('/certificates/eligible-courses', requireAuth, requireRole(['peserta']), async (c) => {
    const user = c.get('user') as UserWithRole
    return c.json(await service.getEligibleCourses(user.id))
  })

  app.post('/certificates/generate/:courseId', requireAuth, requireRole(['peserta']), async (c) => {
    const user = c.get('user') as UserWithRole
    const certificate = await service.generateCertificateForUser(user.id, c.req.param('courseId'))
    return c.json({ certificate }, 201)
  })

  app.get(
    '/certificates/:id/download',
    requireAuth,
    requireRole(['peserta', 'admin']),
    async (c) => {
      const certificate = await service.findById(c.req.param('id'))
      if (!certificate)
        return errorResponse(c, 404, 'CERTIFICATE_NOT_FOUND', 'Certificate not found')
      if (!certificate.fileUrl)
        return errorResponse(c, 404, 'CERTIFICATE_PDF_NOT_AVAILABLE', 'Certificate PDF not available')
      return c.redirect(certificate.fileUrl, 302)
    },
  )

  return app
}
