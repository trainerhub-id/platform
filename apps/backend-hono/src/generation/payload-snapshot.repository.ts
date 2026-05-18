import { createHash } from 'node:crypto'
import { db } from '../db/client'
import { documentPayloadSnapshots } from '../db/schema'

export function hashPayload(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export class PayloadSnapshotRepository {
  async save(input: {
    documentId: string
    flow: string
    documentType: string
    payload: unknown
    schemaVersion: string
  }) {
    const [snapshot] = await db
      .insert(documentPayloadSnapshots)
      .values({
        documentId: input.documentId,
        flow: input.flow,
        documentType: input.documentType,
        payload: input.payload,
        payloadHash: hashPayload(input.payload),
        schemaVersion: input.schemaVersion,
      })
      .onConflictDoNothing()
      .returning()
    return snapshot ?? null
  }
}
