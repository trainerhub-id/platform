import { env } from '../config/env'

export type ScalevPaymentStatus = 'pending' | 'paid' | 'expired' | 'failed'

export type ScalevStoreSummary = {
  id: number
  unique_id: string
  uuid: string
  name: string
  payment_methods?: string[]
  sub_payment_methods?: string[]
}

export type ScalevProductVariantSummary = {
  id: number
  product_id: number
  unique_id: string
  uuid: string
  name: string
  price: string
}

export type ScalevProductSummary = {
  id: number
  uuid: string
  name: string
  public_name?: string
  item_type?: string
  status?: string
  variants: ScalevProductVariantSummary[]
}

export type UpsertScalevProductParams = {
  name: string
  publicName?: string
  description?: string | null
  price: number
  existingProductId?: number | null
  existingVariantId?: number | null
}

export type CreateScalevOrderParams = {
  storeUniqueId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  paymentMethod: string
  subPaymentMethod?: string | null
  orderVariants: Array<{ variantUniqueId: string; quantity: number }>
  notes?: string
  metadata?: Record<string, unknown>
}

export type ScalevPaymentSession = {
  provider: 'scalev'
  providerOrderId: number
  providerOrderCode: string
  providerReferenceId: string | null
  channel: string
  subChannel: string | null
  status: ScalevPaymentStatus
  checkoutUrl: string | null
  qrString: string | null
  vaNumber: string | null
  expiresAt: string | null
  rawPayload: Record<string, unknown>
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>

export type ScalevServiceOptions = {
  apiKey?: string
  baseUrl?: string
  fetcher?: Fetcher
}

export class ScalevService {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetcher: Fetcher

  constructor(options: ScalevServiceOptions = {}) {
    this.apiKey = options.apiKey ?? env.SCALEV_API_KEY ?? ''
    this.baseUrl = options.baseUrl ?? env.SCALEV_BASE_URL
    this.fetcher = options.fetcher ?? ((input, init) => fetch(input, init))
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...this.getAuthHeaders(),
        ...(init?.headers || {}),
      },
    })
    const text = await response.text()
    const data = text ? JSON.parse(text) : null
    if (!response.ok) {
      const error = data?.error || data?.status || 'Scalev API error'
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
    }
    return data as T
  }

  async listStoresSimplified(): Promise<ScalevStoreSummary[]> {
    const response = await this.request<{ data?: { results?: ScalevStoreSummary[] } }>(
      '/v2/stores/simplified',
      { method: 'GET' },
    )
    return response?.data?.results || []
  }

  async listProductsSimplified(): Promise<ScalevProductSummary[]> {
    const response = await this.request<{ data?: { results?: ScalevProductSummary[] } }>(
      '/v2/products/simplified',
      { method: 'GET' },
    )
    return response?.data?.results || []
  }

  async findProductByVariantUniqueId(
    variantUniqueId: string,
  ): Promise<ScalevProductSummary | null> {
    if (!variantUniqueId) return null
    const products = await this.listProductsSimplified()
    return (
      products.find(
        (product) =>
          Array.isArray(product.variants) &&
          product.variants.some((variant) => variant.unique_id === variantUniqueId),
      ) || null
    )
  }

  async upsertProduct(params: UpsertScalevProductParams): Promise<unknown> {
    const body = {
      name: params.name,
      public_name: params.publicName || params.name,
      item_type: 'digital',
      description: params.description || '',
      variants: [
        {
          id: params.existingVariantId || undefined,
          name: params.name,
          price: params.price.toFixed(2),
          pricing_type: 'one_time',
        },
      ],
    }
    if (params.existingProductId)
      return this.request(`/v2/products/${params.existingProductId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
    return this.request('/v2/products', { method: 'POST', body: JSON.stringify(body) })
  }

  async deleteProduct(productId: number): Promise<unknown> {
    return this.request(`/v2/products/${productId}`, { method: 'DELETE' })
  }

  async createOrder(params: CreateScalevOrderParams): Promise<unknown> {
    return this.request('/v2/order', {
      method: 'POST',
      body: JSON.stringify({
        store_unique_id: params.storeUniqueId,
        customer_name: params.customerName,
        customer_phone: params.customerPhone,
        customer_email: params.customerEmail,
        payment_method: params.paymentMethod,
        sub_payment_method: params.subPaymentMethod || undefined,
        ordervariants: params.orderVariants.map((variant) => ({
          variant_unique_id: variant.variantUniqueId,
          quantity: variant.quantity,
        })),
        notes: params.notes,
        metadata: params.metadata,
      }),
    })
  }

  async createPaymentForOrder(orderId: number): Promise<unknown> {
    return this.request(`/v2/order/${orderId}/payment`, { method: 'POST' })
  }

  async getOrder(orderId: number): Promise<unknown> {
    return this.request(`/v2/order/${orderId}`, { method: 'GET' })
  }

  async checkOrderPayment(orderId: number): Promise<unknown> {
    try {
      return await this.request(`/v2/order/${orderId}/check-payment`, { method: 'POST' })
    } catch (error) {
      if (error instanceof Error && error.message === 'Order is not yet paid.')
        return { status: 'Pending', code: 400, error: error.message }
      throw error
    }
  }

  mapScalevStatus(order: unknown): ScalevPaymentStatus {
    const source = order as {
      data?: Record<string, unknown>
      payment_status?: unknown
      pg_payment_info?: { status?: unknown }
    }
    const data = source.data ?? source
    const paymentStatus = String(data.payment_status || '').toLowerCase()
    const providerStatus = String(
      (data.pg_payment_info as { status?: unknown } | undefined)?.status || '',
    ).toLowerCase()
    if (paymentStatus === 'paid' || paymentStatus === 'settled') return 'paid'
    if (providerStatus === 'expired') return 'expired'
    if (providerStatus === 'failed') return 'failed'
    return 'pending'
  }

  normalizePaymentSession(orderResponse: unknown, paymentResponse?: unknown): ScalevPaymentSession {
    const orderEnvelope = orderResponse as { data?: Record<string, unknown> }
    const order = orderEnvelope?.data || (orderResponse as Record<string, unknown>) || {}
    const paymentEnvelope = paymentResponse as { data?: Record<string, unknown> }
    const payment =
      paymentEnvelope?.data || (order.pg_payment_info as Record<string, unknown> | undefined) || {}
    const paymentMethod = (payment.payment_method as Record<string, unknown> | undefined) || {}
    const virtualAccount =
      (paymentMethod.virtual_account as Record<string, unknown> | undefined) || {}
    const qrCode = (paymentMethod.qr_code as Record<string, unknown> | undefined) || {}
    const vaProps = (virtualAccount.channel_properties as Record<string, unknown> | undefined) || {}
    const qrProps = (qrCode.channel_properties as Record<string, unknown> | undefined) || {}
    const actions = Array.isArray(payment.actions)
      ? (payment.actions as Array<{ url?: string }>)
      : []

    return {
      provider: 'scalev',
      providerOrderId: Number(order.id),
      providerOrderCode: String(order.order_id ?? ''),
      providerReferenceId:
        (order.pg_reference_id as string | undefined) ||
        (payment.reference_id as string | undefined) ||
        null,
      channel: String(order.payment_method ?? ''),
      subChannel: (order.sub_payment_method as string | undefined) || null,
      status: this.mapScalevStatus({ data: { ...order, pg_payment_info: payment } }),
      checkoutUrl:
        (payment.invoice_url as string | undefined) ||
        actions[0]?.url ||
        (order.payment_url as string | undefined) ||
        null,
      qrString: (qrProps.qr_string as string | undefined) || null,
      vaNumber: (vaProps.virtual_account_number as string | undefined) || null,
      expiresAt:
        (vaProps.expires_at as string | undefined) ||
        (qrProps.expires_at as string | undefined) ||
        (payment.expiry_date as string | undefined) ||
        null,
      rawPayload: { order, payment },
    }
  }
}
