import { describe, expect, it } from 'vitest'
import { generateWorkspaceSlug, isReservedSlugSegment, RESERVED_SLUG_SEGMENTS } from './slug-generator'

describe('generateWorkspaceSlug', () => {
  it('formats slug as b<n>-<short_code>', () => {
    expect(generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'trainers' })).toBe('b1-trainers')
    expect(generateWorkspaceSlug({ batchNumber: 15, courseShortCode: 'masters' })).toBe('b15-masters')
  })

  it('lowercases short_code', () => {
    expect(generateWorkspaceSlug({ batchNumber: 2, courseShortCode: 'Trainers' })).toBe('b2-trainers')
  })

  it('throws when short_code is empty', () => {
    expect(() => generateWorkspaceSlug({ batchNumber: 1, courseShortCode: '' })).toThrow(
      /short_code is required/,
    )
  })

  it('throws when batch_number is not a positive integer', () => {
    expect(() => generateWorkspaceSlug({ batchNumber: 0, courseShortCode: 'trainers' })).toThrow(
      /batch_number must be a positive integer/,
    )
    expect(() => generateWorkspaceSlug({ batchNumber: -1, courseShortCode: 'trainers' })).toThrow()
    expect(() => generateWorkspaceSlug({ batchNumber: 1.5, courseShortCode: 'trainers' })).toThrow()
  })

  it('throws when short_code is reserved', () => {
    expect(() =>
      generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'admin' }),
    ).toThrow(/reserved/)
  })

  it('throws when short_code contains invalid characters', () => {
    expect(() =>
      generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'trainers!' }),
    ).toThrow(/invalid characters/)
    expect(() =>
      generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'tra ners' }),
    ).toThrow(/invalid characters/)
  })
})

describe('isReservedSlugSegment', () => {
  it('returns true for reserved words', () => {
    for (const word of RESERVED_SLUG_SEGMENTS) {
      expect(isReservedSlugSegment(word)).toBe(true)
    }
  })

  it('is case-insensitive', () => {
    expect(isReservedSlugSegment('Admin')).toBe(true)
    expect(isReservedSlugSegment('AUTH')).toBe(true)
  })

  it('returns false for non-reserved', () => {
    expect(isReservedSlugSegment('trainers')).toBe(false)
    expect(isReservedSlugSegment('b1-trainers')).toBe(false)
  })
})
