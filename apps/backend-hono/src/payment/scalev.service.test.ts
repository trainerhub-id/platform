import { describe, expect, it } from 'vitest'
import { ScalevService } from './scalev.service'

describe('ScalevService', () => {
  it('normalizes paid order and QR payment details', () => {
    const service = new ScalevService({ apiKey: 'key', baseUrl: 'https://scalev.example' })

    const result = service.normalizePaymentSession({
      data: {
        id: 42,
        order_id: 'ORD-42',
        pg_reference_id: 'REF-42',
        payment_method: 'qris',
        payment_status: 'paid',
        pg_payment_info: {
          invoice_url: 'https://pay.example/invoice',
          payment_method: {
            qr_code: {
              channel_properties: {
                qr_string: 'QRDATA',
                expires_at: '2026-05-16T00:00:00Z',
              },
            },
          },
        },
      },
    })

    expect(result).toMatchObject({
      provider: 'scalev',
      providerOrderId: 42,
      providerOrderCode: 'ORD-42',
      providerReferenceId: 'REF-42',
      channel: 'qris',
      status: 'paid',
      checkoutUrl: 'https://pay.example/invoice',
      qrString: 'QRDATA',
      expiresAt: '2026-05-16T00:00:00Z',
    })
  })

  it('sends authenticated requests to Scalev', async () => {
    const calls: Array<{ input: string; init: RequestInit | undefined }> = []
    const service = new ScalevService({
      apiKey: 'secret',
      baseUrl: 'https://scalev.example',
      fetcher: async (input, init) => {
        calls.push({ input: String(input), init })
        return new Response(
          JSON.stringify({
            data: { results: [{ id: 1, unique_id: 'store_1', uuid: 'uuid_1', name: 'Store' }] },
          }),
          { status: 200 },
        )
      },
    })

    const stores = await service.listStoresSimplified()

    expect(stores).toHaveLength(1)
    expect(calls[0]?.input).toBe('https://scalev.example/v2/stores/simplified')
    expect((calls[0]?.init?.headers as Record<string, string>).Authorization).toBe('Bearer secret')
  })
})
