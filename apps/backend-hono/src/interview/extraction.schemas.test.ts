import { describe, expect, it } from 'vitest'
import { extractionResultSchema } from './extraction.schemas'

describe('extractionResultSchema', () => {
  it('accepts explicit field patches', () => {
    const parsed = extractionResultSchema.parse({
      patches: [
        {
          flow: 'master',
          phaseKey: 'profile',
          fieldKey: 'organization_name',
          value: 'PT Maju Jaya',
          source: 'user_explicit',
          confidence: 0.95,
        },
      ],
      pendingSuggestions: [],
      confirmedPendingFields: [],
      generateConfirmed: false,
    })

    expect(parsed.patches[0]?.fieldKey).toBe('organization_name')
  })

  it('accepts question-only empty extraction', () => {
    const parsed = extractionResultSchema.parse({
      patches: [],
      pendingSuggestions: [],
      confirmedPendingFields: [],
      generateConfirmed: false,
    })

    expect(parsed.patches).toEqual([])
  })

  it('rejects unknown flow', () => {
    expect(() =>
      extractionResultSchema.parse({
        patches: [
          {
            flow: 'legacy',
            phaseKey: 'profile',
            fieldKey: 'x',
            value: 'x',
            source: 'user_explicit',
          },
        ],
        pendingSuggestions: [],
        confirmedPendingFields: [],
        generateConfirmed: false,
      }),
    ).toThrow()
  })
})
