import { eq } from 'drizzle-orm'
import type { MiddlewareHandler } from 'hono'
import { errorResponse } from '../common/errors'
import { db } from '../db/client'
import { sessions, users } from '../db/schema'
import { type AuthSession, type AuthUser, auth } from './better-auth'

export type AuthVariables = {
  user: AuthUser | null
  session: AuthSession | null
}

export const sessionMiddleware: MiddlewareHandler<{ Variables: AuthVariables }> = async (
  c,
  next,
) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (session?.user && session.session) {
    const [dbUser] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
    c.set('user', { ...session.user, ...(dbUser ?? {}) } as AuthUser)
    c.set('session', session.session)
    await next()
    return
  }

  const bearerToken = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  const queryToken = c.req.query('token')
  const token = bearerToken || queryToken

  if (token) {
    const [row] = await db
      .select({ session: sessions, user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1)

    if (row && row.session.expiresAt > new Date()) {
      c.set('user', row.user as AuthUser)
      c.set('session', row.session as AuthSession)
      await next()
      return
    }
  }

  c.set('user', null)
  c.set('session', null)
  await next()
}

export const requireAuth: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const user = c.get('user')
  if (!user) {
    return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
  }
  await next()
}
