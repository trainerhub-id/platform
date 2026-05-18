import { Icon } from '@iconify/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from 'src/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from 'src/components/ai-elements/message'
import { Button } from 'src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { ScrollArea } from 'src/components/ui/scroll-area'
import { Textarea } from 'src/components/ui/textarea'
import { cn } from 'src/lib/utils'
import {
  type AiDocument,
  type AiFlow,
  type ConversationMessage,
  createDocument,
  deleteDocument,
  getReadiness,
  type InterviewReadiness,
  listDocuments,
  listMessages,
  sendInterviewMessage,
  updateDocument,
} from './ai-workspace.api'
import { checkpointConfig, getEffectiveStatus, getProgress } from './checkpoints'

type UiMessage =
  | ConversationMessage
  | {
      id: string
      documentId: string
      role: 'user' | 'assistant'
      content: string
      createdAt: string
      pending?: boolean
    }

const roleOrder: Record<ConversationMessage['role'], number> = {
  system: 0,
  tool: 1,
  user: 2,
  assistant: 3,
}

function getMessageTime(message: UiMessage) {
  const parsed = Date.parse(message.createdAt || '')
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeMessages(messages: UiMessage[]) {
  return messages.slice().sort((left, right) => {
    const timeDiff = getMessageTime(left) - getMessageTime(right)
    if (timeDiff !== 0) return timeDiff

    const roleDiff = roleOrder[left.role] - roleOrder[right.role]
    if (roleDiff !== 0) return roleDiff

    return left.id.localeCompare(right.id)
  })
}

type AiWorkspaceProps = {
  flow: AiFlow
}

const flowCopy = {
  master: {
    title: 'AI for Master',
    subtitle: 'Bangun master JSON dari percakapan terarah sampai siap generate dokumen.',
    newTitle: 'Master Baru',
    emptyPrompt: 'Mulai dari nama lembaga, nama trainer, dan program yang ingin dibuat.',
    accent: 'text-primary bg-primary/10',
  },
  trainer: {
    title: 'AI for Trainer',
    subtitle: 'Rancang dokumen trainer dari ide kelas, SKKNI, dan detail pelatihan.',
    newTitle: 'Trainer Baru',
    emptyPrompt: 'Ceritakan topik kelas, audiens, dan hasil belajar yang kamu mau.',
    accent: 'text-info bg-lightinfo',
  },
} satisfies Record<
  AiFlow,
  {
    title: string
    subtitle: string
    newTitle: string
    emptyPrompt: string
    accent: string
  }
>

function createDocumentTitle(flow: AiFlow) {
  const label = flow === 'master' ? 'Master' : 'Trainer'
  return `${label} ${new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())}`
}

function formatDocumentDate(value?: string) {
  if (!value) return 'Tanggal belum tersedia'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Tanggal belum tersedia'

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}

export default function AiWorkspace({ flow }: AiWorkspaceProps) {
  const copy = flowCopy[flow]
  const [documents, setDocuments] = useState<AiDocument[]>([])
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [readiness, setReadiness] = useState<InterviewReadiness | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSearchingTool, setIsSearchingTool] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? null,
    [activeDocumentId, documents],
  )

  const loadDocuments = useCallback(async () => {
    const nextDocuments = (await listDocuments())
      .filter((document) => document.flow === flow)
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt || right.createdAt || '') -
          Date.parse(left.updatedAt || left.createdAt || ''),
      )

    setDocuments(nextDocuments)
    setActiveDocumentId((current) => {
      if (current && nextDocuments.some((document) => document.id === current)) return current
      return nextDocuments[0]?.id ?? null
    })
  }, [flow])

  const loadConversation = useCallback(async (documentId: string) => {
    const [nextMessages, nextReadiness] = await Promise.all([
      listMessages(documentId),
      getReadiness(documentId),
    ])
    setMessages(normalizeMessages(nextMessages))
    setReadiness(nextReadiness)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setIsLoading(true)
      setError(null)
      try {
        await loadDocuments()
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat dokumen AI')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadInitialData()
    return () => {
      cancelled = true
    }
  }, [loadDocuments])

  useEffect(() => {
    let cancelled = false

    async function loadActiveConversation() {
      if (!activeDocumentId) {
        setMessages([])
        setReadiness(null)
        return
      }

      setError(null)
      try {
        const [nextMessages, nextReadiness] = await Promise.all([
          listMessages(activeDocumentId),
          getReadiness(activeDocumentId),
        ])
        if (!cancelled) {
          setMessages(normalizeMessages(nextMessages))
          setReadiness(nextReadiness)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat percakapan')
      }
    }

    void loadActiveConversation()
    return () => {
      cancelled = true
    }
  }, [activeDocumentId])

  const handleCreateDocument = useCallback(
    async (title?: string) => {
      setIsCreating(true)
      setError(null)
      try {
        const document = await createDocument({
          flow,
          title: title?.trim() || createDocumentTitle(flow),
        })
        setDocuments((current) => [document, ...current])
        setActiveDocumentId(document.id)
        setMessages([])
        setReadiness(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal membuat percakapan baru')
      } finally {
        setIsCreating(false)
      }
    },
    [flow],
  )

  const handleRenameDocument = useCallback(async (documentId: string, title: string) => {
    const updated = await updateDocument(documentId, { title })
    setDocuments((current) =>
      current.map((document) => (document.id === updated.id ? updated : document)),
    )
  }, [])

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      await deleteDocument(documentId)
      const nextDocuments = documents.filter((document) => document.id !== documentId)
      setDocuments(nextDocuments)

      if (activeDocumentId === documentId) {
        const nextActiveId = nextDocuments[0]?.id ?? null
        setActiveDocumentId(nextActiveId)
        if (!nextActiveId) {
          setMessages([])
          setReadiness(null)
        }
      }
    },
    [activeDocumentId, documents],
  )

  const handleSend = useCallback(async () => {
    const message = input.trim()
    if (!message || isSending) return

    let documentId = activeDocumentId
    setInput('')
    setIsSending(true)
    setError(null)

    // Detect SKKNI search confirmation to show tool loading animation
    const isUnitSelectionPhase = readiness?.phase === 'unit_selection'
    const isConfirmation = /^(?:ya+a*|iya+h*|yes+|y+|ok+e*|oke+y*|setuju|lanjut|lanjutkan|siap|gas|boleh)(?:\s+\S*)?$/i.test(message.trim())
    if (isUnitSelectionPhase && isConfirmation) {
      setIsSearchingTool(true)
    }

    try {
      if (!documentId) {
        const document = await createDocument({ flow, title: createDocumentTitle(flow) })
        documentId = document.id
        setDocuments((current) => [document, ...current])
        setActiveDocumentId(document.id)
      }

      const userMessage: UiMessage = {
        id: `local-user-${Date.now()}`,
        documentId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
        pending: true,
      }
      const assistantMessage: UiMessage = {
        id: `local-assistant-${Date.now()}`,
        documentId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        pending: true,
      }

      setMessages((current) => normalizeMessages([...current, userMessage, assistantMessage]))

      await sendInterviewMessage({
        documentId,
        message,
        onChunk: (chunk) => {
          // Detect when tool call starts (empty content = waiting for tool) vs content arriving
          setMessages((current) => {
            const updated = current.map((item) =>
              item.id === assistantMessage.id ? { ...item, content: item.content + chunk } : item,
            )
            // If assistant message has content, tool search is done
            const assistantMsg = updated.find((m) => m.id === assistantMessage.id)
            if (assistantMsg && assistantMsg.content.length > 0) {
              setIsSearchingTool(false)
            }
            return normalizeMessages(updated)
          })
        },
      })

      await Promise.all([loadDocuments(), loadConversation(documentId)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan')
      setInput(message)
    } finally {
      setIsSending(false)
      setIsSearchingTool(false)
    }
  }, [activeDocumentId, flow, input, isSending, loadConversation, loadDocuments])

  const progress = getProgress(flow, readiness)

  return (
    <div
      className="flex -mx-5 -my-8 min-h-0 overflow-hidden lg:-mx-8"
      style={{ height: 'calc(100dvh - 79px)', background: 'var(--ai-bg, #F8F6F2)' }}
    >
      {/* Main chat column */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden" style={{ borderRight: '1px solid var(--ai-border, #E8E2D8)', background: 'var(--ai-surface, #FFFFFF)' }}>

        {/* Top info bar */}
        <div className="z-10 px-4 py-2.5 md:px-6" style={{ borderBottom: '1px solid var(--ai-border, #E8E2D8)', background: 'var(--ai-surface, #FFFFFF)' }}>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
                  style={{ background: 'var(--ai-accent-bg, #F5EBDD)', color: 'var(--ai-gold, #B8863B)' }}
                >
                  {activeDocument?.title || copy.newTitle}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: 'var(--ai-accent-bg, #F5EBDD)', color: 'var(--ai-gold, #B8863B)' }}
                >
                  {progress}%
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
                Fase: <span className="font-medium" style={{ color: 'var(--ai-text-primary, #1F2937)' }}>{readiness?.phase || activeDocument?.currentPhase || 'brainstorming'}</span>
              </span>
            </div>

            <DocumentManager
              activeDocumentId={activeDocumentId}
              copy={copy}
              documents={documents}
              flow={flow}
              isBusy={isCreating || isLoading || isSending}
              onCreate={handleCreateDocument}
              onDelete={handleDeleteDocument}
              onRename={handleRenameDocument}
              onSwitch={setActiveDocumentId}
            />
          </div>

          {error ? (
            <div className="mt-2 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#dc2626' }}>
              {error}
            </div>
          ) : null}
        </div>

        {/* Chat area */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1" style={{ background: 'var(--ai-bg, #F8F6F2)' }}>
              {messages.length === 0 ? (
                <Conversation className="h-full">
                  <ConversationEmptyState
                    description={copy.emptyPrompt}
                    icon={<Icon icon="solar:chat-round-dots-bold-duotone" height={32} style={{ color: 'var(--ai-gold, #B8863B)' }} />}
                    title="Mulai percakapan terarah"
                  />
                </Conversation>
              ) : (
                <Conversation className="h-full">
                  <ConversationContent className="mx-auto min-h-full w-full max-w-3xl px-4 py-6 md:px-6">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} onSelectUnit={setInput} />
                    ))}
                    {isSearchingTool ? (
                      <ToolSearchAnimation />
                    ) : isSending ? (
                      <div className="flex items-center gap-2 pl-1 text-xs" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: 'var(--ai-gold, #B8863B)' }} />
                        Sedang memproses...
                      </div>
                    ) : null}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
              )}
            </div>

            {/* Input area */}
            <div className="shrink-0 px-4 py-3 md:px-6" style={{ borderTop: '1px solid var(--ai-border, #E8E2D8)', background: 'var(--ai-surface, #FFFFFF)' }}>
              <div
                className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl px-4 py-3"
                style={{ border: '1px solid var(--ai-border, #E8E2D8)', background: 'var(--ai-surface, #FFFFFF)', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.06)' }}
              >
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSend()
                    }
                  }}
                  disabled={isSending}
                  placeholder={copy.emptyPrompt}
                  aria-label="Tulis pesan"
                  className="max-h-[120px] min-h-[40px] flex-1 resize-none border-0 bg-transparent px-0 py-0 text-sm leading-6 shadow-none focus-visible:ring-0"
                  style={{ color: 'var(--ai-text-primary, #1F2937)' }}
                />
                <button
                  type="button"
                  aria-label="Kirim pesan"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isSending}
                  className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--ai-gold, #B8863B)', color: '#fff' }}
                >
                  <Icon icon="solar:plain-bold" height={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CheckpointPanel flow={flow} readiness={readiness} progress={progress} />
    </div>
  )
}

function DocumentManager({
  activeDocumentId,
  copy,
  documents,
  flow,
  isBusy,
  onCreate,
  onDelete,
  onRename,
  onSwitch,
}: {
  activeDocumentId: string | null
  copy: (typeof flowCopy)[AiFlow]
  documents: AiDocument[]
  flow: AiFlow
  isBusy: boolean
  onCreate: (title?: string) => Promise<void>
  onDelete: (documentId: string) => Promise<void>
  onRename: (documentId: string, title: string) => Promise<void>
  onSwitch: (documentId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [workingId, setWorkingId] = useState<string | null>(null)

  const fallbackTitle =
    flow === 'master' ? `Master ${documents.length + 1}` : `Trainer ${documents.length + 1}`

  const handleCreate = async () => {
    setWorkingId('create')
    try {
      await onCreate(newTitle.trim() || fallbackTitle)
      setNewTitle('')
      setShowCreate(false)
      setOpen(false)
    } finally {
      setWorkingId(null)
    }
  }

  const startRename = (document: AiDocument) => {
    setEditingId(document.id)
    setEditingTitle(document.title)
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  const handleRename = async () => {
    if (!editingId) return
    const nextTitle = editingTitle.trim()
    if (!nextTitle) {
      cancelRename()
      return
    }

    setWorkingId(editingId)
    try {
      await onRename(editingId, nextTitle)
      cancelRename()
    } finally {
      setWorkingId(null)
    }
  }

  const handleDelete = async (document: AiDocument) => {
    const confirmed = window.confirm(
      `Hapus dokumen "${document.title}"? Percakapan di dokumen ini ikut berpindah dari daftar.`,
    )
    if (!confirmed) return

    setWorkingId(document.id)
    try {
      await onDelete(document.id)
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--ai-border, #E8E2D8)', color: 'var(--ai-text-primary, #1F2937)', background: 'var(--ai-surface, #FFFFFF)' }}
        >
          <Icon icon="solar:folder-with-files-bold" height={14} style={{ color: 'var(--ai-gold, #B8863B)' }} />
          Kelola Dokumen
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[520px]" hideCloseButton>
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon icon="solar:folder-with-files-bold" height={18} />
            Dokumen Saya
          </DialogTitle>
          <DialogDescription className="text-xs text-bodytext">
            Buat, ganti, atau rename dokumen. Thread chat mengikuti dokumen aktif.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-bodytext">{documents.length} dokumen</p>
          <Button
            variant="lightprimary"
            size="xs"
            onClick={() => setShowCreate((current) => !current)}
            disabled={workingId === 'create'}
          >
            <Icon icon="solar:add-circle-bold" height={14} />
            Baru
          </Button>
        </div>

        {showCreate ? (
          <div className="flex gap-2 rounded-md border border-dashed border-border bg-muted/30 p-2">
            <Input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleCreate()
                if (event.key === 'Escape') {
                  setShowCreate(false)
                  setNewTitle('')
                }
              }}
              placeholder={fallbackTitle}
              disabled={workingId === 'create'}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="xs" onClick={() => void handleCreate()} disabled={workingId === 'create'}>
              {workingId === 'create' ? (
                <Icon icon="svg-spinners:ring-resize" height={14} />
              ) : (
                'Buat'
              )}
            </Button>
          </div>
        ) : null}

        {documents.length === 0 ? (
          <div className="rounded-md border border-border p-5 text-center">
            <Icon
              icon="solar:document-add-bold-duotone"
              height={34}
              className="mx-auto text-bodytext"
            />
            <p className="mt-2 text-sm font-semibold text-ld">Belum ada dokumen</p>
            <p className="mt-1 text-xs text-bodytext">{copy.emptyPrompt}</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-1.5">
              {documents.map((document) => {
                const isActive = document.id === activeDocumentId
                const isEditing = document.id === editingId
                const isWorking = document.id === workingId

                return (
                  <div
                    key={document.id}
                    className={cn(
                      'group rounded-md border p-2.5 transition-colors',
                      isActive
                        ? 'border-primary bg-lightprimary/70'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30',
                    )}
                  >
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <Input
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') void handleRename()
                            if (event.key === 'Escape') cancelRename()
                          }}
                          disabled={isWorking}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button size="xs" onClick={() => void handleRename()} disabled={isWorking}>
                          {isWorking ? (
                            <Icon icon="svg-spinners:ring-resize" height={14} />
                          ) : (
                            <Icon icon="solar:check-circle-bold" height={14} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={cancelRename}
                          disabled={isWorking}
                        >
                          <Icon icon="solar:close-circle-bold" height={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isActive) {
                              onSwitch(document.id)
                              setOpen(false)
                            }
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon
                              icon="solar:document-bold"
                              height={15}
                              className={cn(
                                'shrink-0',
                                isActive ? 'text-primary' : 'text-bodytext',
                              )}
                            />
                            <span className="truncate text-sm font-semibold text-ld">
                              {document.title}
                            </span>
                            {isActive ? (
                              <span
                                className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: 'var(--ai-accent-bg, #F5EBDD)', color: 'var(--ai-gold, #B8863B)' }}
                              >
                                Aktif
                              </span>
                            ) : null}
                          </div>
                          <p className="ml-6 mt-0.5 truncate text-xs text-bodytext">
                            {formatDocumentDate(document.updatedAt || document.createdAt)}
                            {document.currentPhase ? `, ${document.currentPhase}` : ''}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-7 w-7 p-0"
                            onClick={() => startRename(document)}
                            disabled={isWorking}
                            aria-label={`Rename ${document.title}`}
                          >
                            <Icon icon="solar:pen-bold" height={13} />
                          </Button>
                          <Button
                            variant="ghosterror"
                            size="xs"
                            className="h-7 w-7 p-0"
                            onClick={() => void handleDelete(document)}
                            disabled={isWorking}
                            aria-label={`Hapus ${document.title}`}
                          >
                            {isWorking ? (
                              <Icon icon="svg-spinners:ring-resize" height={13} />
                            ) : (
                              <Icon icon="solar:trash-bin-trash-bold" height={13} />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Regex to detect SKKNI unit code pattern e.g. N.79JPW00.140.1
const SKKNI_CODE_RE = /[A-Z]\.\d{2}[A-Z0-9]+\.\d{3}\.\d+/g

function parseSkkniUnits(content: string): Array<{ code: string; title: string }> {
  // Match lines like: "1. **N.79JPW00.140.1** - Judul unit" or "N.79JPW00.140.1 — Judul"
  const lines = content.split('\n')
  const results: Array<{ code: string; title: string }> = []
  for (const line of lines) {
    const codeMatch = line.match(SKKNI_CODE_RE)
    if (!codeMatch) continue
    const code = codeMatch[0]
    // Extract title: text after the code, strip markdown bold/dash
    const afterCode = line.slice(line.indexOf(code) + code.length)
    const title = afterCode.replace(/^[\s\-–—*_:]+/, '').replace(/\*\*/g, '').trim()
    if (code && !results.find((r) => r.code === code)) {
      results.push({ code, title: title || code })
    }
  }
  return results
}

function SkkniCards({ units, onSelect }: { units: Array<{ code: string; title: string }>; onSelect: (val: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  if (units.length === 0) return null
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>
        Pilih unit — klik untuk memilih
      </p>
      {units.map((u) => (
        <button
          key={u.code}
          type="button"
          onClick={() => onSelect(`Aku pilih unit ini ${u.code}`)}
          onMouseEnter={() => setHovered(u.code)}
          onMouseLeave={() => setHovered(null)}
          className="flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-all"
          style={{
            border: `1px solid ${hovered === u.code ? '#B8863B' : '#E8E2D8'}`,
            background: hovered === u.code ? '#F7F1E8' : '#FFFFFF',
            boxShadow: hovered === u.code ? '0 2px 8px rgba(184,134,59,0.12)' : 'none',
          }}
        >
          <span
            className="shrink-0 rounded-lg px-2 py-0.5 text-[12px] font-bold font-mono"
            style={{ background: hovered === u.code ? '#F4E8D2' : '#F3F4F6', color: hovered === u.code ? '#B8863B' : '#374151' }}
          >
            {u.code}
          </span>
          <span className="text-[13px] leading-snug" style={{ color: hovered === u.code ? '#1F2937' : '#4B5563' }}>
            {u.title}
          </span>
          {hovered === u.code && (
            <Icon icon="solar:arrow-right-bold" height={14} style={{ color: '#B8863B', flexShrink: 0, marginTop: 2 }} />
          )}
        </button>
      ))}
    </div>
  )
}

function ToolSearchAnimation() {
  const steps = ['Menganalisis konteks pelatihan...', 'Mencari unit SKKNI relevan...', 'Mencocokkan kompetensi...']
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 1200)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ border: '1px solid #E8E2D8', background: '#FFFFFF', maxWidth: '72ch' }}
    >
      <div className="flex shrink-0 items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              background: '#B8863B',
              opacity: step === i ? 1 : 0.3,
              transition: 'opacity 0.3s',
            }}
          />
        ))}
      </div>
      <span className="text-[13px]" style={{ color: '#6B7280' }}>
        {steps[step]}
      </span>
    </div>
  )
}

function MessageBubble({ message, onSelectUnit }: { message: UiMessage; onSelectUnit?: (val: string) => void }) {
  const isUser = message.role === 'user'
  const skkniUnits = !isUser && message.content ? parseSkkniUnits(message.content) : []

  return (
    <Message from={isUser ? 'user' : 'assistant'}>
      <MessageContent
        className={cn('max-w-[min(72ch,86vw)]')}
        style={
          isUser
            ? {
                background: 'var(--ai-gold, #B8863B)',
                color: '#fff',
                boxShadow: '0 1px 3px 0 rgba(184,134,59,0.2)',
              }
            : {
                background: 'var(--ai-surface, #FFFFFF)',
                borderColor: 'var(--ai-border, #E8E2D8)',
                color: 'var(--ai-text-primary, #1F2937)',
                boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
              }
        }
      >
        <MessageResponse whiteText={isUser}>{message.content || '...'}</MessageResponse>
        {skkniUnits.length > 0 && onSelectUnit && (
          <SkkniCards units={skkniUnits} onSelect={onSelectUnit} />
        )}
      </MessageContent>
    </Message>
  )
}

function CheckpointPanel({
  flow,
  readiness,
  progress,
}: {
  flow: AiFlow
  readiness: InterviewReadiness | null
  progress: number
}) {
  // Sidebar state is driven by interview readiness only.
  // Document generation state (Sedang Generate / Siap Diunduh) will be
  // connected to the document generation API when that feature is built.
  return (
    <aside
      className="hidden w-72 flex-shrink-0 overflow-y-auto lg:block"
      style={{ background: 'var(--ai-bg, #F8F6F2)' }}
    >
      <div className="p-5">
        <SidebarBelumGenerate flow={flow} readiness={readiness} progress={progress} />
      </div>
    </aside>
  )
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

const S = {
  gold: '#B8863B',
  goldDark: '#A67831',
  goldSoft: '#F4E8D2',
  cream: '#F7F1E8',
  border: '#E8E2D8',
  bg: '#FAF8F3',
  white: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  green: '#34A853',
  greenBg: '#EAF7EE',
  processBg: '#FFF4DC',
  track: '#E5E7EB',
  tipsBg: '#FBF7EF',
} as const

function ProgressBar({ value, color = S.gold }: { value: number; color?: string }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: S.track }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

// ─── State 1: Belum Generate ─────────────────────────────────────────────────

function SidebarBelumGenerate({
  flow,
  readiness,
  progress,
}: {
  flow: AiFlow
  readiness: InterviewReadiness | null
  progress: number
}) {
  const groups = checkpointConfig[flow]
  const requiredFields = groups.flatMap((g) => g.fields).filter((f) => !f.optional)
  const completedFields = requiredFields.filter((f) =>
    ['captured', 'confirmed'].includes(getEffectiveStatus(readiness, f)),
  )
  const completedGroups = groups.filter((g) =>
    g.fields
      .filter((f) => !f.optional)
      .every((f) => ['captured', 'confirmed'].includes(getEffectiveStatus(readiness, f))),
  )
  const missingFields = requiredFields
    .filter((f) => !['captured', 'confirmed'].includes(getEffectiveStatus(readiness, f)))
    .map((f) => f.label)
    .slice(0, 3)
  const activeGroup = groups.find((g) => g.phaseKey === readiness?.phase) ?? groups[0]
  const nextField = missingFields[0] ?? null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-bold" style={{ color: S.textPrimary }}>Progress Dokumen</p>
            <p className="text-[13px] mt-0.5" style={{ color: S.textSecondary }}>Dokumen Trainer</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: S.goldSoft, color: S.gold }}>
            {progress}%
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>
        <div className="mt-2 flex justify-between text-[13px]" style={{ color: '#374151' }}>
          <span>{completedFields.length}/{requiredFields.length} field</span>
          <span>{completedGroups.length}/{groups.length} fase</span>
        </div>
      </div>

      {/* Current phase */}
      <div className="rounded-[18px] p-5" style={{ border: `1px solid ${S.border}`, background: S.white }}>
        <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: S.textSecondary }}>
          Fase Saat Ini
        </p>
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: '#E8C681' }}>
            <Icon icon="solar:clock-circle-bold" height={14} style={{ color: S.gold }} />
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-bold leading-tight" style={{ color: S.textPrimary }}>
              {activeGroup?.label || 'Brainstorming'}
            </p>
            <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: '#4B5563' }}>
              {activeGroup?.description || 'Arah kelas, audiens, hasil belajar, dan institusi.'}
            </p>
          </div>
        </div>
      </div>

      {/* Next field */}
      {nextField ? (
        <div className="rounded-[18px] p-5" style={{ border: `1px solid ${S.border}`, background: S.white }}>
          <p className="text-[12px] font-bold uppercase tracking-wider mb-2" style={{ color: S.textSecondary }}>
            Berikutnya
          </p>
          <p className="text-[15px] font-bold" style={{ color: S.textPrimary }}>{nextField}</p>
          {missingFields.length > 1 && (
            <p className="mt-1 text-[13px]" style={{ color: S.textSecondary }}>
              Lainnya: {missingFields.slice(1).join(', ')}
            </p>
          )}
        </div>
      ) : null}

      {/* Phase checklist */}
      <div className="space-y-1">
        {groups.map((group) => {
          const req = group.fields.filter((f) => !f.optional)
          const done = req.filter((f) =>
            ['captured', 'confirmed'].includes(getEffectiveStatus(readiness, f)),
          )
          const pct = req.length ? Math.round((done.length / req.length) * 100) : 100
          const isDone = pct === 100
          const isCurrent = readiness?.phase === group.phaseKey

          return (
            <div
              key={group.phaseKey}
              className="flex items-center gap-3 rounded-[14px] px-4"
              style={{
                height: 48,
                background: isCurrent ? S.cream : 'transparent',
              }}
            >
              {isDone ? (
                <Icon icon="solar:check-circle-bold" height={20} style={{ color: S.green, flexShrink: 0 }} />
              ) : isCurrent ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: '#E8C681' }}>
                  <Icon icon="solar:clock-circle-bold" height={13} style={{ color: S.gold }} />
                </div>
              ) : (
                <Icon icon="solar:record-circle-linear" height={20} style={{ color: S.track, flexShrink: 0 }} />
              )}
              <span className="flex-1 truncate text-[14px] font-medium" style={{ color: isCurrent ? S.gold : '#374151' }}>
                {group.label}
              </span>
              <span className="text-[13px] font-medium" style={{ color: isDone ? S.green : isCurrent ? S.gold : '#374151' }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Tips */}
      <div className="rounded-[14px] p-4 flex gap-3" style={{ background: S.tipsBg, border: `1px solid ${S.border}` }}>
        <Icon icon="solar:lightbulb-bold-duotone" height={18} style={{ color: S.gold, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="text-[13px] font-semibold mb-0.5" style={{ color: S.textPrimary }}>Tips</p>
          <p className="text-[13px] leading-relaxed" style={{ color: '#4B5563' }}>
            Lengkapi semua field untuk mempercepat pembuatan dokumen.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── State 2: Sedang Generate ────────────────────────────────────────────────

function CategoryStatusPill({ status }: { status: 'done' | 'processing' | 'waiting' }) {
  if (status === 'done')
    return (
      <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: S.greenBg, color: '#1F8F45' }}>
        Selesai
      </span>
    )
  if (status === 'processing')
    return (
      <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: S.processBg, color: S.gold }}>
        Proses
      </span>
    )
  return (
    <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: '#F3F4F6', color: S.textSecondary }}>
      Menunggu
    </span>
  )
}

function CategoryIcon({ status }: { status: 'done' | 'processing' | 'waiting' }) {
  if (status === 'done')
    return <Icon icon="solar:check-circle-bold" height={22} style={{ color: S.green, flexShrink: 0 }} />
  if (status === 'processing')
    return <Icon icon="svg-spinners:ring-resize" height={20} style={{ color: S.gold, flexShrink: 0 }} />
  return <Icon icon="solar:clock-circle-linear" height={22} style={{ color: S.textMuted, flexShrink: 0 }} />
}

function SidebarSedangGenerate({ categories }: { categories: DocCategory[] }) {
  const totalDocs = categories.reduce((s, c) => s + c.total, 0)
  const doneDocs = categories.reduce((s, c) => s + c.done, 0)
  const pct = Math.round((doneDocs / totalDocs) * 100)

  const catStatus = (c: DocCategory): 'done' | 'processing' | 'waiting' => {
    if (c.done === c.total) return 'done'
    if (c.done > 0 || c.items.some((i) => i.status === 'processing')) return 'processing'
    return 'waiting'
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-bold" style={{ color: S.textPrimary }}>Progress Dokumen</p>
            <p className="text-[13px] mt-0.5" style={{ color: S.textSecondary }}>Dokumen Trainer</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: S.goldSoft, color: S.gold }}>
            {pct}%
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar value={pct} />
        </div>
        <div className="mt-2 flex justify-between text-[13px]" style={{ color: '#374151' }}>
          <span>{doneDocs}/{totalDocs} dokumen selesai</span>
          <span>{categories.filter((c) => catStatus(c) === 'done').length}/{categories.length} fase</span>
        </div>
      </div>

      {/* Generating banner */}
      <div
        className="flex items-center justify-center gap-3 rounded-xl"
        style={{ height: 54, background: '#C89335', cursor: 'not-allowed' }}
      >
        <Icon icon="svg-spinners:ring-resize" height={18} className="text-white" />
        <span className="text-[15px] font-semibold text-white">Membuat Dokumen...</span>
      </div>

      {/* Category cards */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const st = catStatus(cat)
          return (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-[14px] px-4"
              style={{ height: 64, border: `1px solid ${S.border}`, background: S.white }}
            >
              <CategoryIcon status={st} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: S.textPrimary }}>{cat.name}</p>
                <p className="text-[12px]" style={{ color: S.textSecondary }}>
                  {cat.done}/{cat.total} {st === 'done' ? 'selesai' : st === 'processing' ? 'proses' : 'menunggu'}
                </p>
              </div>
              <CategoryStatusPill status={st} />
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="rounded-[14px] p-4 flex gap-3" style={{ background: S.tipsBg, border: `1px solid ${S.border}` }}>
        <Icon icon="solar:info-circle-bold-duotone" height={18} style={{ color: S.gold, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[13px] leading-relaxed" style={{ color: '#4B5563' }}>
          Dokumen dibuat bertahap dan akan muncul saat siap diunduh.
        </p>
      </div>
    </div>
  )
}

// ─── State 3: Siap Diunduh ───────────────────────────────────────────────────

function SidebarSiapDiunduh({ categories }: { categories: DocCategory[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    program: true,
    kurikulum: true,
    asesmen: false,
    administrasi: false,
  })

  const totalDocs = categories.reduce((s, c) => s + c.total, 0)

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[15px] font-bold" style={{ color: S.textPrimary }}>Dokumen Siap Diunduh</p>
            <p className="text-[13px] mt-0.5" style={{ color: S.textSecondary }}>Dokumen Trainer</p>
          </div>
          <span className="rounded-full px-3 py-1 text-[13px] font-bold" style={{ background: S.greenBg, color: '#1F8F45' }}>
            100%
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar value={100} color={S.green} />
        </div>
        <p className="mt-2 text-[13px]" style={{ color: '#374151' }}>
          {totalDocs}/{totalDocs} dokumen selesai
        </p>
      </div>

      {/* Download all button */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2.5 rounded-xl transition-colors"
        style={{ height: 58, background: S.gold, color: '#fff' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = S.goldDark }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = S.gold }}
      >
        <Icon icon="solar:download-bold" height={20} />
        <span className="text-[15px] font-bold">Unduh Semua .ZIP</span>
      </button>

      {/* Accordion categories */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isOpen = expanded[cat.id] ?? false
          return (
            <div key={cat.id} className="overflow-hidden rounded-[14px]" style={{ border: `1px solid ${S.border}`, background: S.white }}>
              {/* Header row */}
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 text-left"
                style={{ height: 54 }}
                onClick={() => toggle(cat.id)}
              >
                <Icon icon="solar:check-circle-bold" height={20} style={{ color: S.green, flexShrink: 0 }} />
                <span className="flex-1 text-[14px] font-semibold truncate" style={{ color: S.textPrimary }}>
                  {cat.name}
                </span>
                <span className="text-[13px]" style={{ color: '#374151' }}>{cat.done}/{cat.total}</span>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  height={14}
                  style={{
                    color: S.textMuted,
                    flexShrink: 0,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {/* Expanded rows */}
              {isOpen && (
                <div style={{ borderTop: `1px solid #EFEAE2` }}>
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3"
                      style={{ height: 48, paddingLeft: 46 }}
                    >
                      <span className="flex-1 truncate text-[13px]" style={{ color: '#4B5563' }}>
                        {item.name}
                      </span>
                      <span
                        className="rounded-full text-[11px] font-semibold"
                        style={{ background: S.greenBg, color: '#1F8F45', padding: '3px 10px' }}
                      >
                        Siap
                      </span>
                      <button
                        type="button"
                        className="flex items-center justify-center rounded-[10px] ml-2"
                        style={{ width: 32, height: 32, border: `1px solid #DDB878`, background: S.white, flexShrink: 0 }}
                        aria-label={`Unduh ${item.name}`}
                      >
                        <Icon icon="solar:download-linear" height={14} style={{ color: S.gold }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="rounded-[14px] p-4 flex gap-3" style={{ background: S.tipsBg, border: `1px solid ${S.border}` }}>
        <Icon icon="solar:shield-check-bold-duotone" height={18} style={{ color: S.green, flexShrink: 0, marginTop: 1 }} />
        <p className="text-[13px] leading-relaxed" style={{ color: '#4B5563' }}>
          Semua dokumen tersimpan aman dan dapat diunduh kapan saja.
        </p>
      </div>
    </div>
  )
}

// ─── CheckpointPanel (orchestrator) ──────────────────────────────────────────