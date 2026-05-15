const API_URL = import.meta.env.VITE_API_URL || '/api'

export type AiFlow = 'master' | 'trainer'

export type AiDocument = {
  id: string
  flow: AiFlow
  title: string
  status: string
  currentPhase: string
  masterJson?: unknown
  readiness?: unknown
  createdAt?: string
  updatedAt?: string
}

export type ConversationMessage = {
  id: string
  documentId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  metadata?: unknown
  createdAt?: string
}

export type FieldStatus = 'missing' | 'captured' | 'pending_confirmation' | 'confirmed' | 'rejected'

export type ReadinessField = {
  phaseKey: string
  fieldKey: string
  status: FieldStatus
  value?: unknown
}

export type InterviewReadiness = {
  ready: boolean
  phase: string
  missing: string[]
  pendingConfirmation: string[]
  optionalGaps?: string[]
  fields: ReadinessField[]
}

async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.error?.message || payload?.message || response.statusText
    throw new Error(message || 'Request failed')
  }

  return response.json() as Promise<T>
}

export async function listDocuments() {
  const payload = await apiJson<{ documents: AiDocument[] }>('/documents')
  return payload.documents
}

export async function createDocument(input: { flow: AiFlow; title: string }) {
  const payload = await apiJson<{ document: AiDocument }>('/documents', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return payload.document
}

export async function updateDocument(documentId: string, input: { title: string }) {
  const payload = await apiJson<{ document: AiDocument }>(`/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return payload.document
}

export async function deleteDocument(documentId: string) {
  await apiJson<{ ok: true }>(`/documents/${documentId}`, {
    method: 'DELETE',
  })
}

export async function listMessages(documentId: string) {
  const payload = await apiJson<{ messages: ConversationMessage[] }>(
    `/interview/${documentId}/messages`,
  )
  return payload.messages
}

export async function getReadiness(documentId: string) {
  return apiJson<InterviewReadiness>(`/interview/${documentId}/readiness`)
}

export async function sendInterviewMessage(input: {
  documentId: string
  message: string
  onChunk: (chunk: string) => void
}) {
  const response = await fetch(`${API_URL}/interview/${input.documentId}/message`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input.message }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = payload?.error?.message || payload?.message || response.statusText
    throw new Error(message || 'Message request failed')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    const text = await response.text()
    input.onChunk(text)
    return text
  }

  const decoder = new TextDecoder()
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    text += chunk
    input.onChunk(chunk)
  }

  const finalChunk = decoder.decode()
  if (finalChunk) {
    text += finalChunk
    input.onChunk(finalChunk)
  }

  return text
}
