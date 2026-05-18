import { describe, expect, it } from 'vitest'
import {
  createDefaultMasterJson,
  createDocumentRecord,
  isDocumentOwner,
} from './document.repository'

describe('document repository helpers', () => {
  it('creates default master json for master flow', () => {
    const json = createDefaultMasterJson('master')
    expect(json.schema_key).toBe('hono_master_alpha_v1')
    expect(json.brainstorming_master).toBeTruthy()
    expect(json.unit).toBeTruthy()
  })

  it('creates a document record shape', () => {
    const record = createDocumentRecord({
      ownerUserId: 'user_1',
      flow: 'master',
      title: 'Dokumen Master',
    })
    expect(record.ownerUserId).toBe('user_1')
    expect(record.status).toBe('draft')
    expect(record.currentPhase).toBe('profile')
  })

  it('checks document ownership', () => {
    expect(isDocumentOwner({ ownerUserId: 'user_1' }, 'user_1')).toBe(true)
    expect(isDocumentOwner({ ownerUserId: 'user_1' }, 'user_2')).toBe(false)
  })
})
