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
          setMessages((current) =>
            normalizeMessages(
              current.map((item) =>
                item.id === assistantMessage.id ? { ...item, content: item.content + chunk } : item,
              ),
            ),
          )
        },
      })

      await Promise.all([loadDocuments(), loadConversation(documentId)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan')
      setInput(message)
    } finally {
      setIsSending(false)
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
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {isSending ? (
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

function MessageBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user'

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
  const groups = checkpointConfig[flow]
  const requiredFields = groups.flatMap((group) => group.fields).filter((field) => !field.optional)
  const completedFields = requiredFields.filter((field) =>
    ['captured', 'confirmed'].includes(getEffectiveStatus(readiness, field)),
  )
  const completedGroups = groups.filter((group) =>
    group.fields
      .filter((field) => !field.optional)
      .every((field) => ['captured', 'confirmed'].includes(getEffectiveStatus(readiness, field))),
  )
  const missingFields = requiredFields
    .filter((field) => !['captured', 'confirmed'].includes(getEffectiveStatus(readiness, field)))
    .map((field) => field.label)
    .slice(0, 3)
  const documentLabel = flow === 'master' ? 'Dokumen Master' : 'Dokumen Trainer'
  const activeGroup = groups.find((group) => group.phaseKey === readiness?.phase) ?? groups[0]
  const nextField = missingFields[0] ?? null

  return (
    <aside
      className="hidden w-72 flex-shrink-0 overflow-y-auto lg:block"
      style={{ background: 'var(--ai-bg, #F8F6F2)' }}
    >
      <div className="p-5 space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold" style={{ color: 'var(--ai-text-primary, #1F2937)' }}>
                Progress Dokumen
              </h4>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
                {documentLabel}
              </p>
            </div>
            <span
              className="rounded-lg px-2 py-1 text-xs font-semibold"
              style={{ background: 'var(--ai-accent-bg, #F5EBDD)', color: 'var(--ai-gold, #B8863B)' }}
            >
              {progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ai-border, #E8E2D8)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: readiness?.ready ? '#34A853' : 'var(--ai-gold, #B8863B)' }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
            <span>{completedFields.length}/{requiredFields.length} field</span>
            <span>{completedGroups.length}/{groups.length} fase</span>
          </div>
        </div>

        {/* Current phase card */}
        <div
          className="rounded-xl p-3.5"
          style={{ background: 'var(--ai-accent-bg, #F5EBDD)', border: '1px solid var(--ai-border, #E8E2D8)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--ai-gold, #B8863B)' }}>
            Fase Saat Ini
          </p>
          <div className="flex items-start gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'var(--ai-gold, #B8863B)' }}
            >
              <Icon icon="solar:clock-circle-bold-duotone" height={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--ai-text-primary, #1F2937)' }}>
                {activeGroup?.label || 'Brainstorming'}
              </p>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
                {activeGroup?.description || 'Lengkapi informasi utama melalui chat.'}
              </p>
            </div>
          </div>
        </div>

        {/* Ready or next field */}
        {readiness?.ready ? (
          <div
            className="rounded-xl p-3.5"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
          >
            <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Siap generate</p>
            <p className="mt-1 text-xs leading-5" style={{ color: '#6B7280' }}>
              Field utama sudah lengkap untuk lanjut ke dokumen.
            </p>
          </div>
        ) : nextField ? (
          <div
            className="rounded-xl p-3.5"
            style={{ background: 'var(--ai-surface, #FFFFFF)', border: '1px solid var(--ai-border, #E8E2D8)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
              Berikutnya
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--ai-text-primary, #1F2937)' }}>
              {nextField}
            </p>
            {missingFields.length > 1 ? (
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--ai-text-secondary, #6B7280)' }}>
                Lainnya: {missingFields.slice(1).join(', ')}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Phase checklist */}
        <div className="space-y-1">
          {groups.map((group) => {
            const requiredGroupFields = group.fields.filter((field) => !field.optional)
            const completedGroupFields = requiredGroupFields.filter((field) =>
              ['captured', 'confirmed'].includes(getEffectiveStatus(readiness, field)),
            )
            const groupProgress = requiredGroupFields.length
              ? Math.round((completedGroupFields.length / requiredGroupFields.length) * 100)
              : 100
            const groupDone = groupProgress === 100
            const isCurrent = readiness?.phase === group.phaseKey

            return (
              <div
                key={group.phaseKey}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors"
                style={{
                  background: isCurrent ? 'var(--ai-accent-bg, #F5EBDD)' : 'transparent',
                }}
              >
                <StatusIcon done={groupDone} current={isCurrent} />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-xs font-medium"
                    style={{ color: isCurrent ? 'var(--ai-gold, #B8863B)' : 'var(--ai-text-secondary, #6B7280)' }}
                  >
                    {group.label}
                  </p>
                </div>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: groupDone ? '#16a34a' : isCurrent ? 'var(--ai-gold, #B8863B)' : 'var(--ai-text-secondary, #6B7280)' }}
                >
                  {groupProgress}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

function StatusIcon({ done, current }: { done: boolean; current: boolean }) {
  if (done) {
    return <Icon icon="solar:check-circle-bold" height={18} style={{ color: '#34A853', flexShrink: 0 }} />
  }
  if (current) {
    return <Icon icon="solar:clock-circle-bold-duotone" height={18} style={{ color: 'var(--ai-gold, #B8863B)', flexShrink: 0 }} />
  }
  return <Icon icon="solar:record-circle-linear" height={18} style={{ color: 'var(--ai-border, #E8E2D8)', flexShrink: 0 }} />
}
