import type { MiddlewareHandler } from 'hono'
import { errorResponse } from '../common/errors'
import type { AuthVariables } from './auth.middleware'

type RoleUser = {
  role?: string
}

export function requireRole(roles: string[]): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const user = c.get('user') as RoleUser | null
    if (!user) {
      return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    }

    const role = !user.role || user.role === 'user' ? 'peserta' : user.role
    if (!roles.includes(role)) {
      return errorResponse(c, 403, 'FORBIDDEN', 'Insufficient role')
    }

    await next()
  }
}
