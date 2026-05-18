import { describe, expect, it } from 'vitest'
import { PesertaService } from './peserta.service'

describe('PesertaService', () => {
  it('creates peserta profile for user', async () => {
    const service = new PesertaService({
      repository: {
        create: async (input: unknown) => ({ id: 'peserta_1', ...(input as object) }),
      } as any,
    })

    const profile = await service.create('user_1', {
      nama: 'Budi',
      email: 'budi@example.com',
      noWa: '081234567890',
      tShirtSize: 'L',
    })

    expect(profile.clerkId).toBe('user_1')
    expect(profile.nama).toBe('Budi')
  })

  it('falls back to email and links profile', async () => {
    let linked = false
    const service = new PesertaService({
      repository: {
        findByClerkId: async () => null,
        findByEmail: async () => ({
          id: 'peserta_1',
          clerkId: 'old',
          nama: 'Budi',
          email: 'budi@example.com',
        }),
        linkClerkId: async () => {
          linked = true
        },
      } as any,
    })

    const profile = await service.getProfile('user_1', 'budi@example.com')

    expect(profile.clerkId).toBe('user_1')
    expect(linked).toBe(true)
  })

  it('does not grant access from profile payment status without paid enrollment access', async () => {
    const service = new PesertaService({
      repository: {
        findByClerkId: async () => ({
          id: 'peserta_1',
          clerkId: 'user_1',
          nama: 'Budi',
          email: 'budi@example.com',
          paymentStatus: 'paid',
        }),
      } as any,
      enrollmentService: {
        getPaidAccess: async () => ({
          hasTier: false,
          tierNames: [],
          aiFeatures: [],
          courseIds: [],
          benefits: [],
          enrollments: [],
        }),
      },
    })

    const access = await service.getAccess('user_1')

    expect(access).toMatchObject({
      hasTier: false,
      tierName: null,
      aiFeatures: [],
      courseIds: [],
      benefits: [],
    })
  })
})
