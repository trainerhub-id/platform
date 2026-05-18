import { Hono } from 'hono'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { errorResponse } from '../common/errors'
import type { WorkspaceService } from './workspace.service'

type Variables = AuthVariables & { requestId: string }
type ServiceLike = Pick<WorkspaceService, 'listForUser' | 'findByUserAndSlug'>

export function createWorkspaceRoutes(service: ServiceLike) {
  const app = new Hono<{ Variables: Variables }>()

  app.get('/workspaces', requireAuth, async (c) => {
    const user = c.get('user')
    if (!user) return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    const list = await service.listForUser(user.id)
    return c.json(list)
  })

  app.get('/workspaces/by-slug/:slug', requireAuth, async (c) => {
    const user = c.get('user')
    if (!user) return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    const slug = c.req.param('slug')
    const ws = await service.findByUserAndSlug(user.id, slug)
    if (!ws) return errorResponse(c, 404, 'NOT_FOUND', 'Workspace not found')
    return c.json(ws)
  })

  return app
}
