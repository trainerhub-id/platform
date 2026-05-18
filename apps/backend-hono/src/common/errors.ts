import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { logger } from './logger'

export type ErrorBody = {
  error: {
    code: string
    message: string
    requestId: string | null
  }
}

export function errorResponse(c: Context, status: number, code: string, message: string) {
  return c.json<ErrorBody>(
    {
      error: {
        code,
        message,
        requestId: c.get('requestId') ?? null,
      },
    },
    status as 400,
  )
}

export function handleAppError(err: Error, c: Context) {
  if (err instanceof HTTPException) {
    return errorResponse(c, err.status, 'HTTP_ERROR', err.message)
  }

  const knownErrors: Record<string, { status: number; message: string }> = {
    BATCH_NOT_FOUND: { status: 404, message: 'Batch not found' },
    BATCH_NOT_OPEN: { status: 404, message: 'Batch is not open for registration' },
    BATCH_NOT_DRAFT: { status: 409, message: 'Batch is not a draft' },
    BATCH_REQUIRES_ACTIVE_TIER: { status: 409, message: 'Batch requires at least one active tier' },
    BATCH_TIER_PRICE_REQUIRED: {
      status: 409,
      message: 'Active tiers must have a price greater than zero',
    },
    BATCH_TIERS_NOT_SYNCED: {
      status: 409,
      message: 'Active tiers must be synced before publishing',
    },
    TIER_NOT_FOUND: { status: 404, message: 'Tier not found' },
    TIER_BATCH_MISMATCH: { status: 400, message: 'Tier does not belong to batch' },
    DUPLICATE_REGISTRATION: { status: 409, message: 'Duplicate registration' },
    PAYMENT_SESSION_NOT_FOUND: { status: 404, message: 'Payment session not found' },
    INVALID_CLAIM_TOKEN: { status: 403, message: 'Invalid claim token' },
    PAYMENT_NOT_COMPLETED: { status: 409, message: 'Payment is not completed' },
    PAYMENT_NOT_SUCCESSFUL: { status: 409, message: 'Payment is not successful' },
    SIGN_IN_TOKEN_EXPIRED: { status: 410, message: 'Sign-in token expired' },
  }

  const known = knownErrors[err.message]
  if (known) {
    return errorResponse(c, known.status, err.message, known.message)
  }

  logger.error({ err, requestId: c.get('requestId') }, 'Unhandled request error')
  return errorResponse(c, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error')
}
