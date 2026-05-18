import { randomBytes } from 'node:crypto'
import { AuditLogService } from '../audit/audit-log.service'
import { env } from '../config/env'
import { EnrollmentService } from '../enrollment/enrollment.service'
import { PaymentRepository, type TierInput, type UpdateTierInput } from './payment.repository'
import { type ScalevPaymentSession, ScalevService } from './scalev.service'

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

type PaymentRepositoryLike = {
  getBatchBySlugOrId(
    batchSlugOrId: string,
  ): Promise<{ id: string; namaBatch?: string | null } | null>
  getPublicBatchInfo(
    batchSlug: string,
  ): Promise<{ batch: Record<string, unknown>; tiers: Array<Record<string, unknown>> }>
  getPublicTierInfo(
    batchSlug: string,
    tierSlug: string,
  ): Promise<{ batch: Record<string, unknown>; tier: Record<string, unknown> }>
  getTierBySlugOrId(batchId: string, tierSlugOrId: string): Promise<TierRecord | null>
  findPaymentByEmailAndBatch(email: string, batchId: string): Promise<{ status: string } | null>
  createPaymentSession(input: CreatePaymentSessionInput): Promise<Record<string, unknown>>
  getPaymentSessionById(sessionId: string): Promise<PaymentSessionRecord | null>
  markClaimTokenUsed(sessionId: string): Promise<void>
  updatePaymentSessionUrl(sessionId: string, paymentUrl: string): Promise<void>
  updateSessionFromScalev(
    sessionId: string,
    input: {
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
    },
  ): Promise<PaymentSessionRecord | null>
  getTiersByBatch(batchId: string): Promise<TierRecord[]>
  getTierById(tierId: string): Promise<TierRecord | null>
  getTierTemplateById(id: string): Promise<{
    id: string
    name: string
    slug: string
    description?: string | null
    defaultCourseIds?: string[] | null
    defaultAiFeatures?: string[] | null
    defaultBenefits?: string[] | null
  } | null>
  createTier(batchId: string, input: TierInput): Promise<TierRecord>
  updateTier(tierId: string, input: UpdateTierInput): Promise<TierRecord | null>
  deleteTier(tierId: string): Promise<void>
  getPaymentsByBatch(batchId: string): Promise<PaymentSessionRecord[]>
}

type EnrollmentServiceLike = Pick<
  EnrollmentService,
  'ensurePendingEnrollmentForPayment' | 'markPaid'
>
type AuditLogServiceLike = Pick<AuditLogService, 'record'>

type PaymentSessionRecord = {
  id: string
  email: string
  batchId?: string | null
  tierId?: string | null
  pesertaId?: string | null
  enrollmentId?: string | null
  amount?: number | null | undefined
  status: string
  provider?: string | null
  providerOrderId?: number | null
  providerOrderCode?: string | null
  providerReferenceId?: string | null
  providerPaymentMethod?: string | null
  providerSubPaymentMethod?: string | null
  providerCheckoutUrl?: string | null
  providerQrString?: string | null
  providerVaNumber?: string | null
  providerExpiresAt?: Date | string | null
  claimToken?: string | null
  claimTokenUsed?: boolean | null
  clerkSignInToken?: string | null
  clerkTokenExpiry?: Date | string | null
  paymentUrl?: string | null
  referenceId?: string | null
}

type CreateRegistrationInput = {
  email: string
  whatsapp: string
  batchSlug: string
  tierSlug: string
  paymentMethod?: string
  subPaymentMethod?: string | null | undefined
}

type PaymentProvider = 'manual' | 'scalev'

type ScalevLike = Pick<
  ScalevService,
  | 'listStoresSimplified'
  | 'findProductByVariantUniqueId'
  | 'upsertProduct'
  | 'deleteProduct'
  | 'createOrder'
  | 'createPaymentForOrder'
  | 'getOrder'
  | 'checkOrderPayment'
  | 'normalizePaymentSession'
>

type TierRecord = {
  id: string
  batchId: string
  name?: string | null
  slug?: string | null
  description?: string | null
  tierTemplateId?: string | null
  price: number
  courseIds?: string[] | null
  aiFeatures?: string[] | null
  benefits?: string[] | null
  scalevStoreUniqueId?: string | null
  scalevVariantUniqueId?: string | null
  scalevBundlePriceOptionUniqueId?: string | null
  scalevSyncStatus?: string | null
  scalevLastSyncedAt?: Date | string | null
  scalevSyncError?: string | null
}

export class PaymentService {
  private readonly repository: PaymentRepositoryLike
  private readonly enrollmentService: EnrollmentServiceLike
  private readonly auditLog: AuditLogServiceLike
  private readonly scalev: ScalevLike
  private readonly now: () => number
  private readonly createClaimToken: () => string
  private readonly frontendUrl: string
  private readonly paymentProvider: PaymentProvider

  constructor(
    deps: {
      repository?: PaymentRepositoryLike
      enrollmentService?: EnrollmentServiceLike
      auditLog?: AuditLogServiceLike
      scalev?: ScalevLike
      now?: () => number
      createClaimToken?: () => string
      frontendUrl?: string
      paymentProvider?: PaymentProvider
    } = {},
  ) {
    this.repository = deps.repository ?? new PaymentRepository()
    this.enrollmentService = deps.enrollmentService ?? new EnrollmentService()
    this.auditLog = deps.auditLog ?? new AuditLogService()
    this.scalev = deps.scalev ?? new ScalevService()
    this.now = deps.now ?? Date.now
    this.createClaimToken = deps.createClaimToken ?? (() => randomBytes(32).toString('hex'))
    this.frontendUrl = deps.frontendUrl ?? env.FRONTEND_URL
    this.paymentProvider = deps.paymentProvider ?? env.PAYMENT_PROVIDER
  }

  async getPublicBatchInfo(batchSlug: string) {
    return this.repository.getPublicBatchInfo(batchSlug)
  }

  async getPublicTierInfo(batchSlug: string, tierSlug: string) {
    return this.repository.getPublicTierInfo(batchSlug, tierSlug)
  }

  async checkDuplicate(input: { email: string; batchSlug: string }) {
    const batch = await this.repository.getBatchBySlugOrId(input.batchSlug)
    const batchId = batch?.id ?? input.batchSlug
    const existing = await this.repository.findPaymentByEmailAndBatch(input.email, batchId)
    if (!existing) return { isDuplicate: false }
    if (existing.status === 'paid')
      return { isDuplicate: true, message: 'Email ini sudah terdaftar di batch ini' }
    return { isDuplicate: true, message: 'Email ini sudah memiliki pembayaran pending' }
  }

  async getScalevStores() {
    return this.scalev.listStoresSimplified()
  }

  async getTiersByBatch(batchId: string) {
    return this.repository.getTiersByBatch(batchId)
  }

  async createTier(batchId: string, input: TierInput) {
    const tierInput = await this.resolveTierInput(input)
    const tier = await this.repository.createTier(batchId, tierInput)
    return this.syncTierWithScalev(tier)
  }

  async updateTier(tierId: string, input: UpdateTierInput) {
    const tier = await this.repository.updateTier(tierId, input)
    if (!tier) throw new Error('TIER_NOT_FOUND')
    return this.syncTierWithScalev(tier)
  }

  async deleteTier(tierId: string) {
    const tier = await this.repository.getTierById(tierId)
    if (!tier) throw new Error('TIER_NOT_FOUND')
    if (tier.scalevVariantUniqueId) {
      const product = await this.scalev.findProductByVariantUniqueId(tier.scalevVariantUniqueId)
      if (product?.id) await this.scalev.deleteProduct(product.id)
    }
    await this.repository.deleteTier(tierId)
    return { success: true, deletedId: tierId }
  }

  async resyncTierWithScalev(tierId: string) {
    const tier = await this.repository.getTierById(tierId)
    if (!tier) throw new Error('TIER_NOT_FOUND')
    return this.syncTierWithScalev(tier)
  }

  async getResolvedTier(tierId: string) {
    const tier = await this.repository.getTierById(tierId)
    if (!tier) throw new Error('TIER_NOT_FOUND')
    if (!tier.tierTemplateId)
      return {
        ...tier,
        resolvedCourseIds: tier.courseIds ?? null,
        resolvedAiFeatures: tier.aiFeatures ?? null,
        resolvedBenefits: tier.benefits ?? null,
        tierTemplate: null,
      }
    const template = await this.repository.getTierTemplateById(tier.tierTemplateId)
    if (!template) throw new Error('TIER_TEMPLATE_NOT_FOUND')
    return {
      ...tier,
      resolvedCourseIds: tier.courseIds ?? template.defaultCourseIds ?? null,
      resolvedAiFeatures: tier.aiFeatures ?? template.defaultAiFeatures ?? null,
      resolvedBenefits: tier.benefits ?? template.defaultBenefits ?? null,
      tierTemplate: template,
    }
  }

  async getPaymentsByBatch(batchId: string) {
    return this.repository.getPaymentsByBatch(batchId)
  }

  async createRegistration(input: CreateRegistrationInput) {
    const batch = await this.repository.getBatchBySlugOrId(input.batchSlug)
    if (!batch) throw new Error('BATCH_NOT_FOUND')

    const tier = await this.repository.getTierBySlugOrId(batch.id, input.tierSlug)
    if (!tier) throw new Error('TIER_NOT_FOUND')
    if (tier.batchId !== batch.id) throw new Error('TIER_BATCH_MISMATCH')

    const duplicate = await this.checkDuplicate({ email: input.email, batchSlug: batch.id })
    if (duplicate.isDuplicate) throw new Error('DUPLICATE_REGISTRATION')

    const referenceId = `TH-${batch.id.slice(0, 8)}-${this.now()}`
    const claimToken = this.createClaimToken()
    const expiredAt = new Date(this.now() + 24 * 60 * 60 * 1000)
    const paymentUrl = this.buildManualPaymentUrl({
      sessionId: 'pending',
      referenceId,
      email: input.email,
      amount: tier.price,
      batchId: batch.id,
      tierId: tier.id,
      claimToken,
    })
    const paymentMethod = input.paymentMethod || 'qris'
    const subPaymentMethod = paymentMethod === 'va' ? input.subPaymentMethod || null : null
    const pendingEnrollment = await this.enrollmentService.ensurePendingEnrollmentForPayment({
      email: input.email,
      whatsapp: input.whatsapp,
      batchId: batch.id,
      tierId: tier.id,
    })

    const session = await this.repository.createPaymentSession({
      email: input.email,
      whatsapp: input.whatsapp,
      batchId: batch.id,
      tierId: tier.id,
      pesertaId: pendingEnrollment.pesertaId,
      enrollmentId: pendingEnrollment.id,
      batchNameSnapshot: batch.namaBatch ?? null,
      tierNameSnapshot: tier.name ?? null,
      amount: tier.price,
      status: 'pending',
      claimToken,
      paymentUrl,
      referenceId,
      provider: this.paymentProvider,
      providerPaymentMethod: paymentMethod,
      providerSubPaymentMethod: subPaymentMethod,
      expiredAt,
    })
    const sessionId = String(session.id)
    const finalPaymentUrl = this.replaceManualPaymentSession(paymentUrl, sessionId)
    await this.repository.updatePaymentSessionUrl(sessionId, finalPaymentUrl)

    if (this.paymentProvider === 'scalev') {
      const scalevConfig = this.resolveScalevTierConfig(tier)
      const order = await this.scalev.createOrder({
        storeUniqueId: scalevConfig.storeUniqueId,
        customerName: input.email.split('@')[0] ?? input.email,
        customerPhone: input.whatsapp,
        customerEmail: input.email,
        paymentMethod,
        subPaymentMethod,
        orderVariants: [{ variantUniqueId: scalevConfig.variantUniqueId, quantity: 1 }],
        notes: `Pendaftaran ${batch.namaBatch ?? batch.id} - ${tier.name ?? tier.id}`,
        metadata: {
          trainerhub_session_id: sessionId,
          trainerhub_reference_id: referenceId,
          batch_id: batch.id,
          tier_id: tier.id,
          enrollment_id: pendingEnrollment.id,
          email: input.email,
          bundle_price_option_unique_id: scalevConfig.bundlePriceOptionUniqueId,
        },
      })
      let payment: unknown = null
      try {
        const orderId = Number(
          (order as { data?: { id?: unknown }; id?: unknown })?.data?.id ??
            (order as { id?: unknown })?.id,
        )
        payment = await this.scalev.createPaymentForOrder(orderId)
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('already exists')) throw error
      }
      const normalized = this.scalev.normalizePaymentSession(order, payment)
      const updated = await this.repository.updateSessionFromScalev(
        sessionId,
        this.toScalevSessionUpdate(normalized),
      )
      return this.buildCheckoutResponse(
        updated ?? {
          id: sessionId,
          email: input.email,
          amount: tier.price,
          status: normalized.status,
          ...this.sessionFieldsFromScalev(normalized),
        },
      )
    }

    return {
      sessionId,
      amount: tier.price,
      status: 'pending',
      paymentUrl: finalPaymentUrl,
      expiresAt: expiredAt.toISOString(),
      provider: 'manual',
    }
  }

  async getPaymentSessionCheckout(sessionId: string, claimToken?: string) {
    const session = await this.repository.getPaymentSessionById(sessionId)
    if (!session) throw new Error('PAYMENT_SESSION_NOT_FOUND')
    this.assertClaimToken(session, claimToken)
    return this.buildCheckoutResponse(session)
  }

  async refreshScalevPaymentStatus(sessionId: string, claimToken?: string, forceCheck = true) {
    const session = await this.repository.getPaymentSessionById(sessionId)
    if (!session) throw new Error('PAYMENT_SESSION_NOT_FOUND')
    this.assertClaimToken(session, claimToken)
    if (session.provider !== 'scalev' || !session.providerOrderId)
      return this.buildCheckoutResponse(session)

    const order = await this.scalev.getOrder(session.providerOrderId)
    let normalized = this.scalev.normalizePaymentSession(order)
    let updated = await this.repository.updateSessionFromScalev(
      sessionId,
      this.toScalevSessionUpdate(normalized),
    )

    if (forceCheck && normalized.status === 'pending') {
      await this.scalev.checkOrderPayment(session.providerOrderId)
      const refreshedOrder = await this.scalev.getOrder(session.providerOrderId)
      normalized = this.scalev.normalizePaymentSession(refreshedOrder)
      updated = await this.repository.updateSessionFromScalev(
        sessionId,
        this.toScalevSessionUpdate(normalized),
      )
    }

    const updatedSession = updated
      ? { ...session, ...updated }
      : {
          ...session,
          id: sessionId,
          email: session.email,
          amount: session.amount,
          status: normalized.status,
          ...this.sessionFieldsFromScalev(normalized),
        }
    await this.activateEnrollmentIfPaid(updatedSession)
    return this.buildCheckoutResponse(updatedSession)
  }

  async claimPayment(sessionId: string, claimToken?: string) {
    const session = await this.repository.getPaymentSessionById(sessionId)
    if (!session) throw new Error('PAYMENT_SESSION_NOT_FOUND')
    this.assertClaimToken(session, claimToken)
    if (session.status === 'pending') throw new Error('PAYMENT_NOT_COMPLETED')
    if (session.status === 'failed' || session.status === 'expired')
      throw new Error('PAYMENT_NOT_SUCCESSFUL')
    if (session.clerkTokenExpiry && new Date(session.clerkTokenExpiry) < new Date())
      throw new Error('SIGN_IN_TOKEN_EXPIRED')
    await this.activateEnrollmentIfPaid(session)
    if (!session.claimTokenUsed) await this.repository.markClaimTokenUsed(sessionId)
    return {
      signInToken: session.clerkSignInToken ?? null,
      email: session.email,
      paymentStatus: session.status,
      requiresLogin: !session.clerkSignInToken,
    }
  }

  private assertClaimToken(session: PaymentSessionRecord, claimToken?: string) {
    if (session.claimToken && claimToken !== session.claimToken)
      throw new Error('INVALID_CLAIM_TOKEN')
  }

  private async activateEnrollmentIfPaid(session: PaymentSessionRecord) {
    if (session.status !== 'paid' || !session.enrollmentId) return
    await this.enrollmentService.markPaid(session.enrollmentId)
  }

  private buildManualPaymentUrl(params: {
    sessionId: string
    referenceId: string
    email: string
    amount: number
    batchId: string
    tierId: string
    claimToken: string
  }) {
    const url = new URL('/payment/success', this.frontendUrl)
    url.searchParams.set('session', params.sessionId)
    url.searchParams.set('ref', params.referenceId)
    url.searchParams.set('email', params.email)
    url.searchParams.set('amount', String(params.amount))
    url.searchParams.set('batchId', params.batchId)
    url.searchParams.set('tierId', params.tierId)
    url.searchParams.set('token', params.claimToken)
    return url.toString()
  }

  private replaceManualPaymentSession(paymentUrl: string, sessionId: string) {
    const url = new URL(paymentUrl)
    url.searchParams.set('session', sessionId)
    return url.toString()
  }

  private resolveScalevTierConfig(tier: TierRecord) {
    const storeUniqueId = tier.scalevStoreUniqueId || env.SCALEV_STORE_UNIQUE_ID
    const variantUniqueId = tier.scalevVariantUniqueId || env.SCALEV_VARIANT_UNIQUE_ID
    const bundlePriceOptionUniqueId =
      tier.scalevBundlePriceOptionUniqueId || env.SCALEV_BUNDLE_PRICE_OPTION_UNIQUE_ID || null
    if (!storeUniqueId || !variantUniqueId) throw new Error('SCALEV_TIER_MAPPING_INCOMPLETE')
    return { storeUniqueId, variantUniqueId, bundlePriceOptionUniqueId }
  }

  private async resolveTierInput(input: TierInput): Promise<TierInput> {
    if (!input.tierTemplateId) {
      return {
        ...input,
        name: input.name ?? 'Tier',
        slug: input.slug ?? this.createSlug(input.name ?? 'tier'),
      }
    }
    const template = await this.repository.getTierTemplateById(input.tierTemplateId)
    if (!template) throw new Error('TIER_TEMPLATE_NOT_FOUND')
    return {
      ...input,
      name: input.name ?? template.name,
      slug: input.slug ?? template.slug,
      description: input.description ?? template.description ?? null,
      courseIds: input.courseIds ?? template.defaultCourseIds ?? null,
      aiFeatures: input.aiFeatures ?? template.defaultAiFeatures ?? null,
      benefits: input.benefits ?? template.defaultBenefits ?? null,
    }
  }

  private async syncTierWithScalev(tier: TierRecord): Promise<TierRecord> {
    if (this.paymentProvider !== 'scalev') return tier
    try {
      const storeUniqueId = tier.scalevStoreUniqueId || env.SCALEV_STORE_UNIQUE_ID
      if (!storeUniqueId) throw new Error('SCALEV_STORE_NOT_CONFIGURED')
      const existingProduct = tier.scalevVariantUniqueId
        ? await this.scalev.findProductByVariantUniqueId(tier.scalevVariantUniqueId)
        : null
      const existingVariant =
        existingProduct?.variants?.find(
          (variant) => variant.unique_id === tier.scalevVariantUniqueId,
        ) ?? null
      const product = await this.scalev.upsertProduct({
        name: tier.name ?? 'Tier',
        publicName: tier.name ?? 'Tier',
        description: tier.description ?? null,
        price: tier.price,
        existingProductId: existingProduct?.id ?? null,
        existingVariantId: existingVariant?.id ?? null,
      })
      const syncedVariant = (product as { data?: { variants?: Array<{ unique_id?: string }> } })
        ?.data?.variants?.[0]
      if (!syncedVariant?.unique_id) throw new Error('SCALEV_PRODUCT_SYNC_FAILED')
      const updated = await this.repository.updateTier(tier.id, {
        scalevStoreUniqueId: storeUniqueId,
        scalevVariantUniqueId: syncedVariant.unique_id,
        scalevSyncStatus: 'synced',
        scalevLastSyncedAt: new Date(),
        scalevSyncError: null,
      })
      if (!updated) throw new Error('TIER_NOT_FOUND')
      return updated
    } catch (error) {
      await this.repository.updateTier(tier.id, {
        scalevSyncStatus: 'failed',
        scalevSyncError: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private createSlug(value: string) {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'tier'
    )
  }

  private parseProviderExpiry(value?: string | null): Date | null {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  private toScalevSessionUpdate(normalized: ScalevPaymentSession) {
    return {
      provider: normalized.provider,
      providerOrderId: normalized.providerOrderId,
      providerOrderCode: normalized.providerOrderCode,
      providerReferenceId: normalized.providerReferenceId,
      providerPaymentMethod: normalized.channel,
      providerSubPaymentMethod: normalized.subChannel,
      providerCheckoutUrl: normalized.checkoutUrl,
      providerQrString: normalized.qrString,
      providerVaNumber: normalized.vaNumber,
      providerExpiresAt: this.parseProviderExpiry(normalized.expiresAt),
      providerPayload: normalized.rawPayload,
      status: normalized.status,
    }
  }

  private sessionFieldsFromScalev(normalized: ScalevPaymentSession) {
    return {
      provider: normalized.provider,
      providerOrderId: normalized.providerOrderId,
      providerOrderCode: normalized.providerOrderCode,
      providerReferenceId: normalized.providerReferenceId,
      providerPaymentMethod: normalized.channel,
      providerSubPaymentMethod: normalized.subChannel,
      providerCheckoutUrl: normalized.checkoutUrl,
      providerQrString: normalized.qrString,
      providerVaNumber: normalized.vaNumber,
      providerExpiresAt: normalized.expiresAt,
    }
  }

  private buildCheckoutResponse(session: PaymentSessionRecord) {
    const checkoutUrl = session.providerCheckoutUrl ?? session.paymentUrl ?? null
    return {
      sessionId: session.id,
      amount: session.amount,
      status: session.status,
      paymentMethod: session.providerPaymentMethod ?? null,
      subPaymentMethod: session.providerSubPaymentMethod ?? null,
      checkoutUrl,
      paymentUrl: checkoutUrl,
      qrString: session.providerQrString ?? null,
      vaNumber: session.providerVaNumber ?? null,
      expiresAt: session.providerExpiresAt
        ? new Date(session.providerExpiresAt).toISOString()
        : null,
      provider: session.provider ?? 'manual',
      providerOrderId: session.providerOrderId ?? null,
      providerOrderCode: session.providerOrderCode ?? null,
      providerReferenceId: session.providerReferenceId ?? null,
      channel: session.providerPaymentMethod ?? null,
      subChannel: session.providerSubPaymentMethod ?? null,
    }
  }
}
