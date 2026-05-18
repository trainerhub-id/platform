import { and, desc, eq, or } from 'drizzle-orm'
import { db } from '../db/client'
import { batchTiers, batchTraining, paymentSessions, tierTemplates } from '../db/schema'

type CreatePaymentSessionInput = {
  email: string
  whatsapp?: string | null
  batchId: string
  tierId: string
  pesertaId?: string | null
  enrollmentId?: string | null
  batchNameSnapshot?: string | null
  tierNameSnapshot?: string | null
  amount: number
  status: string
  claimToken: string
  paymentUrl: string
  referenceId: string
  provider: string
  providerPaymentMethod?: string | null
  providerSubPaymentMethod?: string | null
  expiredAt: Date
}

export type TierInput = {
  tierTemplateId?: string | null | undefined
  name?: string | undefined
  slug?: string | undefined
  description?: string | null | undefined
  price: number
  maxParticipants?: number | null | undefined
  courseIds?: string[] | null | undefined
  aiFeatures?: string[] | null | undefined
  benefits?: string[] | null | undefined
  scalevStoreUniqueId?: string | null | undefined
  scalevVariantUniqueId?: string | null | undefined
  scalevBundlePriceOptionUniqueId?: string | null | undefined
  scalevSyncStatus?: string | undefined
  scalevLastSyncedAt?: Date | null | undefined
  scalevSyncError?: string | null | undefined
}

export type UpdateTierInput = Omit<Partial<TierInput>, 'price'> & { price?: number | undefined }

export type ScalevSessionUpdate = {
  provider: 'scalev'
  providerOrderId: number
  providerOrderCode: string
  providerReferenceId: string | null
  providerPaymentMethod: string
  providerSubPaymentMethod: string | null
  providerCheckoutUrl: string | null
  providerQrString: string | null
  providerVaNumber: string | null
  providerExpiresAt: Date | null
  providerPayload: Record<string, unknown>
  status: string
}

export class PaymentRepository {
  async getBatchBySlugOrId(value: string) {
    const [bySlug] = await db
      .select()
      .from(batchTraining)
      .where(eq(batchTraining.slug, value))
      .limit(1)
    if (bySlug) return bySlug
    const [byId] = await db.select().from(batchTraining).where(eq(batchTraining.id, value)).limit(1)
    return byId ?? null
  }

  async getTiersByBatch(batchId: string) {
    return db
      .select()
      .from(batchTiers)
      .where(and(eq(batchTiers.batchId, batchId), eq(batchTiers.isActive, true)))
      .orderBy(batchTiers.orderIndex)
  }

  async getTierTemplateById(id: string) {
    const [row] = await db.select().from(tierTemplates).where(eq(tierTemplates.id, id)).limit(1)
    return row ?? null
  }

  async getPublicBatchInfo(batchSlug: string) {
    const batch = await this.getBatchBySlugOrId(batchSlug)
    if (!batch) throw new Error('BATCH_NOT_FOUND')
    if (batch.status === 'draft') throw new Error('BATCH_NOT_OPEN')
    const tiers = await this.getTiersByBatch(batch.id)
    return { batch, tiers }
  }

  async getPublicTierInfo(batchSlug: string, tierSlug: string) {
    const info = await this.getPublicBatchInfo(batchSlug)
    const tier = info.tiers.find((item) => item.slug === tierSlug || item.id === tierSlug)
    if (!tier) throw new Error('TIER_NOT_FOUND')
    return { batch: info.batch, tier }
  }

  async getTierBySlugOrId(batchId: string, tierSlugOrId: string) {
    const [tier] = await db
      .select()
      .from(batchTiers)
      .where(
        and(
          eq(batchTiers.batchId, batchId),
          or(eq(batchTiers.slug, tierSlugOrId), eq(batchTiers.id, tierSlugOrId)),
          eq(batchTiers.isActive, true),
        ),
      )
      .limit(1)
    return tier ?? null
  }

  async getTierById(tierId: string) {
    const [tier] = await db.select().from(batchTiers).where(eq(batchTiers.id, tierId)).limit(1)
    return tier ?? null
  }

  async createTier(batchId: string, input: TierInput) {
    const [tier] = await db
      .insert(batchTiers)
      .values({
        batchId,
        tierTemplateId: input.tierTemplateId ?? null,
        name: input.name ?? 'Tier',
        slug: input.slug ?? 'tier',
        description: input.description ?? null,
        price: input.price,
        maxParticipants: input.maxParticipants ?? null,
        courseIds: input.courseIds ?? null,
        aiFeatures: input.aiFeatures ?? null,
        benefits: input.benefits ?? null,
        scalevStoreUniqueId: input.scalevStoreUniqueId ?? null,
        scalevVariantUniqueId: input.scalevVariantUniqueId ?? null,
        scalevBundlePriceOptionUniqueId: input.scalevBundlePriceOptionUniqueId ?? null,
        scalevSyncStatus: input.scalevSyncStatus ?? 'not_synced',
        scalevLastSyncedAt: input.scalevLastSyncedAt ?? null,
        scalevSyncError: input.scalevSyncError ?? null,
      })
      .returning()
    if (!tier) throw new Error('TIER_CREATE_FAILED')
    return tier
  }

  async updateTier(tierId: string, input: UpdateTierInput) {
    const [tier] = await db
      .update(batchTiers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(batchTiers.id, tierId))
      .returning()
    return tier ?? null
  }

  async deleteTier(tierId: string) {
    await db
      .update(batchTiers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(batchTiers.id, tierId))
  }

  async findPaymentByEmailAndBatch(email: string, batchId: string) {
    const [row] = await db
      .select()
      .from(paymentSessions)
      .where(
        and(
          eq(paymentSessions.email, email),
          eq(paymentSessions.batchId, batchId),
          or(eq(paymentSessions.status, 'pending'), eq(paymentSessions.status, 'paid')),
        ),
      )
      .limit(1)
    return row ?? null
  }

  async getPaymentSessionById(sessionId: string) {
    const [row] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.id, sessionId))
      .limit(1)
    return row ?? null
  }

  async createPaymentSession(input: CreatePaymentSessionInput) {
    const [row] = await db
      .insert(paymentSessions)
      .values({
        email: input.email,
        whatsapp: input.whatsapp ?? null,
        batchId: input.batchId,
        tierId: input.tierId,
        pesertaId: input.pesertaId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        batchNameSnapshot: input.batchNameSnapshot ?? null,
        tierNameSnapshot: input.tierNameSnapshot ?? null,
        amount: input.amount,
        status: input.status,
        claimToken: input.claimToken,
        paymentUrl: input.paymentUrl,
        referenceId: input.referenceId,
        xenditReferenceId: input.referenceId,
        provider: input.provider,
        providerPaymentMethod: input.providerPaymentMethod ?? null,
        providerSubPaymentMethod: input.providerSubPaymentMethod ?? null,
        expiredAt: input.expiredAt,
      })
      .returning()
    if (!row) throw new Error('PAYMENT_SESSION_CREATE_FAILED')
    return row
  }

  async markClaimTokenUsed(sessionId: string) {
    await db
      .update(paymentSessions)
      .set({ claimTokenUsed: true, updatedAt: new Date() })
      .where(eq(paymentSessions.id, sessionId))
  }

  async updatePaymentSessionUrl(sessionId: string, paymentUrl: string) {
    await db
      .update(paymentSessions)
      .set({ paymentUrl, updatedAt: new Date() })
      .where(eq(paymentSessions.id, sessionId))
  }

  async updateSessionFromScalev(sessionId: string, input: ScalevSessionUpdate) {
    const [row] = await db
      .update(paymentSessions)
      .set({
        provider: input.provider,
        providerOrderId: input.providerOrderId,
        providerOrderCode: input.providerOrderCode,
        providerReferenceId: input.providerReferenceId,
        providerPaymentMethod: input.providerPaymentMethod,
        providerSubPaymentMethod: input.providerSubPaymentMethod,
        providerCheckoutUrl: input.providerCheckoutUrl,
        providerQrString: input.providerQrString,
        providerVaNumber: input.providerVaNumber,
        providerExpiresAt: input.providerExpiresAt,
        providerPayload: input.providerPayload,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(paymentSessions.id, sessionId))
      .returning()
    return row ?? null
  }

  async getPaymentsByBatch(batchId: string) {
    return db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.batchId, batchId))
      .orderBy(desc(paymentSessions.createdAt))
  }
}
