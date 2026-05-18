import { describe, expect, it } from 'vitest'
import { sertifikat } from './certificates'
import {
  conversationMessages,
  conversationSummaries,
  documentFieldStates,
  documentMasterProfiles,
  documents,
  documentTrainerProfiles,
} from './documents'
import { courses, pesertaCourseProgress } from './learning'
import { peserta } from './people'

describe('drizzle schema', () => {
  it('exports document tables', () => {
    expect(documents).toBeTruthy()
    expect(documentMasterProfiles).toBeTruthy()
    expect(documentTrainerProfiles).toBeTruthy()
    expect(documentFieldStates).toBeTruthy()
    expect(conversationMessages).toBeTruthy()
    expect(conversationSummaries).toBeTruthy()
    expect(peserta).toBeTruthy()
    expect(courses).toBeTruthy()
    expect(pesertaCourseProgress).toBeTruthy()
    expect(sertifikat).toBeTruthy()
  })
})
