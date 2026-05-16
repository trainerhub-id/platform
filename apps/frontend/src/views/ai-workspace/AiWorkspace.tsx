import { Icon } from '@iconify/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from 'src/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from 'src/components/ai-elements/message'
import { Badge } from 'src/components/ui/badge'
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
import { Progress } from 'src/components/ui/progress'
import { ScrollArea } from 'src/components/ui/scroll-area'
import { Textarea } from 'src/components/ui/textarea'
import { cn } from 'src/lib/utils'
import {
  createDocument,
  deleteDocument,
  getReadiness,
  listDocuments,
  listMessages,
  sendInterviewMessage,
  type AiDocument,
  type AiFlow,
  type ConversationMessage,
  type InterviewReadiness,
  updateDocument,
} from './ai-workspace.api'
import {
  checkpointConfig,
  getEffectiveStatus,
  getProgress,
} from './checkpoints'

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

  const handleCreateDocument = useCallback(async (title?: string) => {
    setIsCreating(true)
    setError(null)
    try {
      const document = await createDocument({ flow, title: title?.trim() || createDocumentTitle(flow) })
      setDocuments((current) => [document, ...current])
      setActiveDocumentId(document.id)
      setMessages([])
      setReadiness(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat percakapan baru')
    } finally {
      setIsCreating(false)
    }
  }, [flow])

  const handleRenameDocument = useCallback(
    async (documentId: string, title: string) => {
      const updated = await updateDocument(documentId, { title })
      setDocuments((current) =>
        current.map((document) => (document.id === updated.id ? updated : document)),
      )
    },
    [],
  )

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
    <div className="flex -mx-5 -my-8 min-h-0 overflow-hidden lg:-mx-8" style={{ height: 'calc(100dvh - 79px)' }}>
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden border-r border-ld bg-white dark:bg-dark">
        <div className="z-10 border-b border-border bg-white/95 px-4 py-2 backdrop-blur dark:bg-dark/95 md:px-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-ld">
                  {activeDocument?.title || copy.newTitle}
                </span>
                <Badge
                  variant={readiness?.ready ? 'lightSuccess' : 'lightPrimary'}
                  className="shrink-0 px-2 py-0.5 text-[11px]"
                >
                  {readiness?.ready ? 'Siap generate' : `${progress}%`}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-bodytext">
                Fase: {readiness?.phase || activeDocument?.currentPhase || 'draft'}
              </p>
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
            <div className="mt-3 rounded-md border border-error/30 bg-lighterror px-3 py-2 text-xs text-error">
              {error}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 bg-muted/20">
              {messages.length === 0 ? (
                <Conversation className="h-full">
                  <ConversationEmptyState
                    description={copy.emptyPrompt}
                    icon={<Icon icon="solar:chat-round-dots-bold-duotone" height={30} />}
                    title="Mulai percakapan terarah"
                  />
                </Conversation>
              ) : (
                <Conversation className="h-full">
                  <ConversationContent className="mx-auto min-h-full w-full max-w-3xl px-4 py-5 md:px-6">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    {isSending ? (
                      <div className="flex items-center gap-2 pl-1 text-xs text-bodytext">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        AI sedang menyusun respons
                      </div>
                    ) : null}
                  </ConversationContent>
                  <ConversationScrollButton />
                </Conversation>
              )}
            </div>

            <div className="shrink-0 border-t border-border bg-white px-3 py-2 dark:bg-dark">
              <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 shadow-sm dark:bg-dark">
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
                  className="max-h-[112px] min-h-10 resize-none border-0 bg-transparent px-1 py-1.5 text-sm leading-5 shadow-none focus-visible:ring-0"
                />
                <Button
                  aria-label="Kirim pesan"
                  className="h-8 w-8 shrink-0 rounded-md p-0"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isSending}
                >
                  <Icon icon="solar:plain-bold" height={16} />
                </Button>
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

  const fallbackTitle = flow === 'master' ? `Master ${documents.length + 1}` : `Trainer ${documents.length + 1}`

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
    const confirmed = window.confirm(`Hapus dokumen "${document.title}"? Percakapan di dokumen ini ikut berpindah dari daftar.`)
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
        <Button variant="outline" size="sm" disabled={isBusy}>
          <Icon icon="solar:folder-with-files-bold" height={16} />
          Kelola Dokumen
        </Button>
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
            <Icon icon="solar:document-add-bold-duotone" height={34} className="mx-auto text-bodytext" />
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
                        <Button variant="ghost" size="xs" onClick={cancelRename} disabled={isWorking}>
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
                              className={cn('shrink-0', isActive ? 'text-primary' : 'text-bodytext')}
                            />
                            <span className="truncate text-sm font-semibold text-ld">{document.title}</span>
                            {isActive ? (
                              <Badge variant="primary" className="shrink-0 px-1.5 py-0.5 text-[10px]">
                                Aktif
                              </Badge>
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
        className={cn(
          'max-w-[min(72ch,86vw)]',
          isUser
            ? 'rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm dark:bg-primary/90'
            : 'rounded-none bg-transparent px-0 py-0 text-foreground shadow-none',
        )}
      >
        <MessageResponse>{message.content || '...'}</MessageResponse>
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
    <aside className="hidden w-80 flex-shrink-0 overflow-y-auto bg-white p-5 dark:bg-dark lg:block">
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-dark dark:text-white">Progress Dokumen</h4>
              <p className="mt-1 text-xs text-bodytext">{documentLabel}</p>
            </div>
            <span className="rounded-md bg-lightprimary px-2 py-1 text-xs font-semibold text-primary">
              {progress}%
            </span>
          </div>

          <Progress
            value={progress}
            className="mt-3 h-1.5"
            variant={readiness?.ready ? 'success' : 'primary'}
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-bodytext">
            <span>{completedFields.length}/{requiredFields.length} field</span>
            <span>{completedGroups.length}/{groups.length} fase</span>
          </div>
        </div>

        <section className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-normal text-bodytext">
            Fase saat ini
          </p>
          <div className="mt-2 flex items-start gap-2">
            <StatusIcon done={false} current />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ld">{activeGroup?.label || 'Brainstorming'}</p>
              <p className="mt-1 text-xs leading-5 text-bodytext">
                {activeGroup?.description || 'Lengkapi informasi utama melalui chat.'}
              </p>
            </div>
          </div>
        </section>

        {readiness?.ready ? (
          <section className="rounded-lg border border-success/20 bg-lightsuccess p-3">
            <p className="text-sm font-semibold text-success">Siap generate</p>
            <p className="mt-1 text-xs leading-5 text-bodytext">
              Field utama sudah lengkap untuk lanjut ke dokumen.
            </p>
          </section>
        ) : nextField ? (
          <section className="rounded-lg border border-border p-3">
            <p className="text-[11px] font-semibold uppercase tracking-normal text-bodytext">
              Berikutnya
            </p>
            <p className="mt-2 text-sm font-semibold text-ld">{nextField}</p>
            {missingFields.length > 1 ? (
              <p className="mt-1 text-xs leading-5 text-bodytext">
                Lainnya: {missingFields.slice(1).join(', ')}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="space-y-1.5">
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
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 transition-colors',
                  isCurrent ? 'bg-lightprimary text-primary' : 'text-bodytext',
                )}
              >
                <StatusIcon done={groupDone} current={isCurrent} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{group.label}</p>
                </div>
                <span className="text-[11px]">{groupProgress}%</span>
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
    return <Icon icon="solar:check-circle-bold" height={20} className="text-success" />
  }
  if (current) {
    return <Icon icon="solar:clock-circle-bold-duotone" height={20} className="text-primary" />
  }
  return <Icon icon="solar:record-circle-linear" height={20} className="text-bodytext" />
}
