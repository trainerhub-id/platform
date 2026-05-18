import { Hono } from 'hono'
import { z } from 'zod'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import { errorResponse } from '../common/errors'
import { DokumenService } from './dokumen.service'

type DokumenVariables = AuthVariables & { requestId: string }
type UserLike = { id: string; role?: string }
type DokumenServiceLike = Pick<
  DokumenService,
  'getKategori' | 'getJenisByKategori' | 'getStatus' | 'upload' | 'delete'
>

export function createDokumenRoutes(service: DokumenServiceLike = new DokumenService()) {
  const app = new Hono<{ Variables: DokumenVariables }>()

  app.get('/dokumen/kategori', requireAuth, requireRole(['peserta', 'admin']), async (c) =>
    c.json(await service.getKategori()),
  )
  app.get('/dokumen/jenis/:kategoriId', requireAuth, requireRole(['peserta', 'admin']), async (c) =>
    c.json(await service.getJenisByKategori(c.req.param('kategoriId'))),
  )
  app.get('/dokumen/status', requireAuth, requireRole(['peserta']), async (c) => {
    const user = c.get('user') as UserLike
    return c.json(await service.getStatus(user.id))
  })
  app.post('/dokumen/upload', requireAuth, requireRole(['peserta']), async (c) => {
    const body = await c.req.parseBody()
    const file = body.file
    const jenisId = body.jenisId
    if (!(file instanceof File))
      return errorResponse(c, 400, 'VALIDATION_ERROR', 'file is required')
    if (typeof jenisId !== 'string' || !z.string().uuid().safeParse(jenisId).success)
      return errorResponse(c, 400, 'VALIDATION_ERROR', 'valid jenisId is required')
    const user = c.get('user') as UserLike
    return c.json(await service.upload(file, jenisId, user.id), 201)
  })
  app.delete('/dokumen/:id', requireAuth, requireRole(['peserta']), async (c) => {
    const user = c.get('user') as UserLike
    return c.json(await service.delete(c.req.param('id'), user.id))
  })

  return app
}
