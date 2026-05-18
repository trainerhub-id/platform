import type { NewAuditLog } from '../db/schema'
import { type AuditLogFilter, AuditLogRepository } from './audit-log.repository'

type Actor = {
  id?: string | null
  email?: string | null
  name?: string | null
}

type AuditRecordInput = {
  actor?: Actor | null
  action: string
  entityType: string
  entityId: string
  batchId?: string | null
  enrollmentId?: string | null
  pesertaId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  requestId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

type AuditLogRepositoryLike = {
  create(input: NewAuditLog): Promise<unknown>
  findMany(filter?: AuditLogFilter): Promise<unknown>
}

export class AuditLogService {
  private readonly repository: AuditLogRepositoryLike

  constructor(deps: { repository?: AuditLogRepositoryLike } = {}) {
    this.repository = deps.repository ?? new AuditLogRepository()
  }

  async record(input: AuditRecordInput) {
    return this.repository.create({
      actorUserId: input.actor?.id ?? null,
      actorEmail: input.actor?.email ?? null,
      actorName: input.actor?.name ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      batchId: input.batchId ?? null,
      enrollmentId: input.enrollmentId ?? null,
      pesertaId: input.pesertaId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata ?? null,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    })
  }

  async findMany(filter: AuditLogFilter) {
    return this.repository.findMany(filter)
  }
}
