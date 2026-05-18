import { describe, expect, it } from 'vitest'
import { EnrollmentService } from './enrollment.service'

describe('EnrollmentService', () => {
  it('returns access only from paid enrollments', async () => {
    const service = new EnrollmentService({
      repository: {
        findAccessByPesertaId: async () => [
          {
            enrollmentId: 'enroll_paid',
            paymentStatus: 'paid',
            tierName: 'Trainer',
            aiFeatures: ['trainer'],
            courseIds: ['course_trainer'],
            benefits: ['Trainer class'],
          },
          {
            enrollmentId: 'enroll_unpaid',
            paymentStatus: 'pending',
            tierName: 'Master',
            aiFeatures: ['master'],
            courseIds: ['course_master'],
            benefits: ['Master class'],
          },
        ],
      } as any,
    })

    const access = await service.getPaidAccess('peserta_1')

    expect(access).toEqual({
      hasTier: true,
      tierNames: ['Trainer'],
      aiFeatures: ['trainer'],
      courseIds: ['course_trainer'],
      benefits: ['Trainer class'],
      enrollments: [{ enrollmentId: 'enroll_paid', tierName: 'Trainer', paymentStatus: 'paid' }],
    })
  })

  it('returns no access when every enrollment is unpaid', async () => {
    const service = new EnrollmentService({
      repository: {
        findAccessByPesertaId: async () => [
          {
            enrollmentId: 'enroll_pending',
            paymentStatus: 'pending',
            tierName: 'Trainer',
            aiFeatures: ['trainer'],
            courseIds: ['course_trainer'],
            benefits: ['Trainer class'],
          },
          {
            enrollmentId: 'enroll_unpaid',
            paymentStatus: 'unpaid',
            tierName: 'Master',
            aiFeatures: ['master'],
            courseIds: ['course_master'],
            benefits: ['Master class'],
          },
        ],
      } as any,
    })

    const access = await service.getPaidAccess('peserta_1')

    expect(access).toEqual({
      hasTier: false,
      tierNames: [],
      aiFeatures: [],
      courseIds: [],
      benefits: [],
      enrollments: [],
    })
  })
})
