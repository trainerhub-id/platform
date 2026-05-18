import type { MiddlewareHandler } from 'hono'
import { errorResponse } from '../common/errors'
import type { Workspace } from '../db/schema'
import type { WorkspaceService } from './workspace.service'

export type WorkspaceContext = {
  workspace: Workspace
}

type ServiceLike = Pick<WorkspaceService, 'findByUserAndSlug'>
type AuthLike = { id: string }

export function requireWorkspace(service: ServiceLike): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as AuthLike | null
    if (!user) {
      return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    }

    const slug = c.req.header('X-Workspace-Slug')?.trim()
    if (!slug) {
      return errorResponse(c, 400, 'WORKSPACE_REQUIRED', 'X-Workspace-Slug header is required')
    }

    const workspace = await service.findByUserAndSlug(user.id, slug)
    if (!workspace) {
      return errorResponse(c, 404, 'WORKSPACE_NOT_FOUND', `Workspace '${slug}' not found`)
    }

    c.set('workspace', workspace)
    await next()
  }
}
