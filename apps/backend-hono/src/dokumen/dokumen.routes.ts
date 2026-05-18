import { Hono } from 'hono'
import { z } from 'zod'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import { errorResponse } from '../common/errors'
import type { Workspace } from '../db/schema'
import { requireWorkspace } from '../workspace/workspace.middleware'
import { WorkspaceService } from '../workspace/workspace.service'
import { DokumenService } from './dokumen.service'

type Variables = AuthVariables & { requestId: string; workspace: Workspace }
type DokumenServiceLike = Pick<
  DokumenService,
  | 'getKategoriForCourse'
  | 'getJenisByKategoriAndCourse'
  | 'getStatus'
  | 'upload'
  | 'delete'
>

export function createDokumenRoutes(deps: {
  dokumenService?: DokumenServiceLike
  workspaceService?: Pick<WorkspaceService, 'findByUserAndSlug'>
} = {}) {
  const dokumenService: DokumenServiceLike = deps.dokumenService ?? new DokumenService()
  const workspaceService = deps.workspaceService ?? new WorkspaceService()
  const app = new Hono<{ Variables: Variables }>()

  const workspaceGuard = requireWorkspace(workspaceService)

  app.get(
    '/dokumen/kategori',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      return c.json(await dokumenService.getKategoriForCourse(ws.courseId))
    },
  )

  app.get(
    '/dokumen/jenis/:kategoriId',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      const kategoriId = c.req.param('kategoriId')
      return c.json(await dokumenService.getJenisByKategoriAndCourse(kategoriId, ws.courseId))
    },
  )

  app.get(
    '/dokumen/status',
    requireAuth,
    requireRole(['peserta']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      return c.json(await dokumenService.getStatus(ws.id))
    },
  )

  app.post(
    '/dokumen/upload',
    requireAuth,
    requireRole(['peserta']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      const body = await c.req.parseBody()
      const file = body.file
      const jenisId = body.jenisId
      if (!(file instanceof File))
        return errorResponse(c, 400, 'VALIDATION_ERROR', 'file is required')
      if (typeof jenisId !== 'string' || !z.string().uuid().safeParse(jenisId).success)
        return errorResponse(c, 400, 'VALIDATION_ERROR', 'valid jenisId is required')

      try {
        const result = await dokumenService.upload({
          file,
          jenisId,
          workspaceId: ws.id,
          pesertaId: ws.pesertaId,
          courseId: ws.courseId,
        })
        return c.json(result, 201)
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_DOCUMENT_TYPE') {
          return errorResponse(
            c,
            400,
            'INVALID_DOCUMENT_TYPE',
            'Document type does not belong to this workspace program',
          )
        }
        throw err
      }
    },
  )

  app.delete(
    '/dokumen/:id',
    requireAuth,
    requireRole(['peserta']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      return c.json(await dokumenService.delete(c.req.param('id'), ws.id))
    },
  )

  return app
}
