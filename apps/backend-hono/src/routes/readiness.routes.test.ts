import { describe, expect, it } from 'vitest'
import { createApp } from '../app'

describe('readiness route', () => {
  it('validates a posted Master field-state checklist', async () => {
    const app = createApp()
    const res = await app.request('/api/interview/readiness/preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        flow: 'master',
        fields: [
          {
            flow: 'master',
            phaseKey: 'profile',
            fieldKey: 'organization_name',
            status: 'confirmed',
            value: 'PT Maju Jaya',
          },
        ],
      }),
    })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ready).toBe(false)
    expect(body.phase).toBe('profile')
    expect(body.fields[0]).toEqual({
      phaseKey: 'profile',
      fieldKey: 'organization_name',
      status: 'confirmed',
    })
  })
})
