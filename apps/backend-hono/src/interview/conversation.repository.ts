import { asc, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { conversationMessages } from '../db/schema'

export type ConversationRole = 'user' | 'assistant' | 'system' | 'tool'

export class ConversationRepository {
  constructor(private readonly client: Pick<typeof db, 'insert' | 'select'> = db) {}

  async addMessage(input: {
    documentId: string
    role: ConversationRole
    content: string
    metadata?: unknown
  }) {
    const [message] = await this.client
      .insert(conversationMessages)
      .values({
        documentId: input.documentId,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? {},
      })
      .returning()
    return message
  }

  async recentMessages(documentId: string, limit = 20) {
    return this.client
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.documentId, documentId))
      .orderBy(desc(conversationMessages.createdAt), asc(conversationMessages.role))
      .limit(limit)
  }
}
