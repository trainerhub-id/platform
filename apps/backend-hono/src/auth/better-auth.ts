import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { Resend } from 'resend'
import { renderPasswordResetEmail } from './emails/password-reset'
import { renderVerifyEmail } from './emails/verify-email'
import { env, getFrontendOrigins } from '../config/env'
import { db } from '../db/client'
import * as schema from '../db/schema'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: getFrontendOrigins(env),
  logger: {
    level: 'warn',
    log: (level, message, ...args) => {
      const detail =
        args[0] && typeof args[0] === 'object' ? JSON.stringify(args[0]) : (args[0] ?? '')
      if (level === 'error') {
        // Classify common auth errors for clearer logs
        if (message.includes('User not found')) {
          console.error(`[auth] EMAIL_NOT_REGISTERED ${detail}`)
        } else if (message.includes('Invalid password') || message.includes('INVALID_PASSWORD')) {
          console.error(`[auth] WRONG_PASSWORD ${detail}`)
        } else if (message.includes('Invalid origin')) {
          console.error(`[auth] INVALID_ORIGIN ${detail}`)
        } else {
          console.error(`[auth] ${message} ${detail}`)
        }
      } else if (level === 'warn') {
        console.warn(`[auth] ${message} ${detail}`)
      }
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    ...(resend && {
      sendResetPassword: async ({ user, url }: { user: { email: string; name?: string | null }; url: string }) => {
        void renderPasswordResetEmail({ url, userName: user.name ?? undefined }).then((html) =>
          resend.emails.send({
            from: env.EMAIL_FROM,
            to: user.email,
            subject: 'Reset Password - TrainerHub',
            html,
          }),
        )
      },
    }),
  },
  ...(resend && {
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string | null }; url: string }) => {
        void renderVerifyEmail({ url, userName: user.name ?? undefined }).then((html) =>
          resend.emails.send({
            from: env.EMAIL_FROM,
            to: user.email,
            subject: 'Verifikasi Email - TrainerHub',
            html,
          }),
        )
      },
    },
  }),
})

export type AuthUser = typeof auth.$Infer.Session.user
export type AuthSession = typeof auth.$Infer.Session.session
