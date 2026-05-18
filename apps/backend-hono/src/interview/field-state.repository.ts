import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { documentFieldStates } from '../db/schema'
import type {
  FieldSnapshotFlow,
  FieldSource,
  FieldStateSnapshot,
  FieldStatus,
} from './field-state.types'

export type UpsertFieldStateInput = {
  documentId: string
  flow: FieldSnapshotFlow
  phaseKey: string
  fieldKey: string
  value: unknown
  status: FieldStatus
  source: FieldSource
  confidence?: string
  pendingSuggestion?: unknown
}

export class FieldStateRepository {
  constructor(private readonly client: Pick<typeof db, 'select' | 'insert'> = db) {}

  async list(documentId: string, flow: FieldSnapshotFlow): Promise<FieldStateSnapshot[]> {
    const rows = await this.client
      .select()
      .from(documentFieldStates)
      .where(
        and(eq(documentFieldStates.documentId, documentId), eq(documentFieldStates.flow, flow)),
      )

    return rows.map((row) => ({
      flow: row.flow as FieldSnapshotFlow,
      phaseKey: row.phaseKey,
      fieldKey: row.fieldKey,
      status: row.status as FieldStatus,
      source: row.source as FieldSource,
      value: row.value,
      pendingSuggestion: row.pendingSuggestion,
    }))
  }

  async upsert(input: UpsertFieldStateInput) {
    const [row] = await this.client
      .insert(documentFieldStates)
      .values({
        documentId: input.documentId,
        flow: input.flow,
        phaseKey: input.phaseKey,
        fieldKey: input.fieldKey,
        value: input.value,
        status: input.status,
        source: input.source,
        confidence: input.confidence,
        pendingSuggestion: input.pendingSuggestion,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          documentFieldStates.documentId,
          documentFieldStates.flow,
          documentFieldStates.phaseKey,
          documentFieldStates.fieldKey,
        ],
        set: {
          value: input.value,
          status: input.status,
          source: input.source,
          confidence: input.confidence,
          pendingSuggestion: input.pendingSuggestion,
          updatedAt: new Date(),
        },
      })
      .returning()

    return row
  }
}
