import { Hono } from 'hono'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import type { Workspace } from '../db/schema'
import { requireWorkspace } from '../workspace/workspace.middleware'
import { WorkspaceService } from '../workspace/workspace.service'
import { TodosService } from './todos.service'

type TodosVariables = AuthVariables & { requestId: string; workspace: Workspace }
type UserLike = { id: string; role?: string }
type TodosServiceLike = Pick<
  TodosService,
  'listForWorkspace' | 'updateStatus' | 'initializeTodosForWorkspace' | 'syncTodosWithProfileState'
>

export function createTodosRoutes(
  deps: {
    service?: TodosServiceLike
    workspaceService?: Pick<WorkspaceService, 'findByUserAndSlug'>
  } = {},
) {
  const service: TodosServiceLike = deps.service ?? new TodosService()
  const workspaceService = deps.workspaceService ?? new WorkspaceService()
  const app = new Hono<{ Variables: TodosVariables }>()
  const workspaceGuard = requireWorkspace(workspaceService)

  app.get(
    '/todos/my',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const user = c.get('user') as UserLike
      const ws = c.get('workspace')
      await service.initializeTodosForWorkspace(ws.id, user.id, ws.pesertaId)
      return c.json(await service.listForWorkspace(ws.id))
    },
  )

  app.post(
    '/todos/init',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const user = c.get('user') as UserLike
      const ws = c.get('workspace')
      await service.initializeTodosForWorkspace(ws.id, user.id, ws.pesertaId)
      return c.json({ success: true })
    },
  )

  app.post(
    '/todos/sync',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const user = c.get('user') as UserLike
      const ws = c.get('workspace')
      await service.syncTodosWithProfileState(ws.id, user.id, ws.pesertaId)
      return c.json({ success: true })
    },
  )

  app.patch(
    '/todos/:id/complete',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      await service.updateStatus({ id: c.req.param('id'), workspaceId: ws.id, status: 'done' })
      return c.json({ success: true })
    },
  )

  app.patch(
    '/todos/:id/start',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      await service.updateStatus({
        id: c.req.param('id'),
        workspaceId: ws.id,
        status: 'in_progress',
      })
      return c.json({ success: true })
    },
  )

  return app
}
