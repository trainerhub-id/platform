import type { NewTodo, Todo } from '../db/schema'
import { TODO_DEFINITIONS } from './todo-definitions'
import { TodosRepository } from './todos.repository'

type TodoStatus = 'todo' | 'in_progress' | 'waiting_review' | 'done'

type RepositoryLike = Pick<
  TodosRepository,
  | 'findByWorkspace'
  | 'insertMissingForWorkspace'
  | 'pruneWorkspaceTodosToKeys'
  | 'updateDefinitionMetadataForWorkspace'
  | 'updateStatus'
  | 'setStatusByKey'
  | 'hasPaidEnrollment'
  | 'hasUploadedDocument'
  | 'hasCompletedLesson'
  | 'hasAiDocument'
  | 'ensurePesertaForUser'
>

export class TodosService {
  private readonly repository: RepositoryLike

  constructor(deps: { repository?: RepositoryLike } = {}) {
    this.repository = deps.repository ?? new TodosRepository()
  }

  async initializeTodosForWorkspace(
    workspaceId: string,
    userId: string,
    pesertaId: string,
  ) {
    const definitions = Object.values(TODO_DEFINITIONS).filter(
      (d) => d.role === 'participant',
    )
    const values: NewTodo[] = definitions.map((d) => ({
      workspaceId,
      userId,
      key: d.key,
      title: d.title,
      category: d.category,
      status: 'todo',
      isBlocking: d.isBlocking ?? false,
      meta: {},
    }))
    await this.repository.pruneWorkspaceTodosToKeys(
      workspaceId,
      definitions.map((d) => d.key),
    )
    await this.repository.insertMissingForWorkspace(workspaceId, values)
    await this.repository.updateDefinitionMetadataForWorkspace(workspaceId, values)
    await this.syncTodosWithProfileState(workspaceId, userId, pesertaId)
  }

  async listForWorkspace(workspaceId: string) {
    const rows = await this.repository.findByWorkspace(workspaceId)
    return rows
      .sort((a, b) => getDefinitionOrder(a.key) - getDefinitionOrder(b.key))
      .map(enrichTodo)
  }

  async updateStatus(input: { id: string; workspaceId: string; status: TodoStatus }) {
    const row = await this.repository.updateStatus(input.id, input.workspaceId, input.status)
    if (!row) throw new Error('TODO_NOT_FOUND')
    return row
  }

  async syncTodosWithProfileState(workspaceId: string, userId: string, pesertaId: string) {
    const profile = await this.repository.ensurePesertaForUser(userId)
    if (!profile?.id) return

    const hasPaidAccess =
      profile.paymentStatus === 'paid' || (await this.repository.hasPaidEnrollment(pesertaId))
    await this.repository.setStatusByKey(
      workspaceId,
      'lakukan_pembayaran',
      hasPaidAccess ? 'done' : 'todo',
    )
    await this.repository.setStatusByKey(
      workspaceId,
      'selesaikan_kelas',
      (await this.repository.hasCompletedLesson(pesertaId)) ? 'done' : 'todo',
    )
    await this.repository.setStatusByKey(
      workspaceId,
      'upload_dokumen',
      (await this.repository.hasUploadedDocument(workspaceId)) ? 'done' : 'todo',
    )
    await this.repository.setStatusByKey(
      workspaceId,
      'coba_ai',
      (await this.repository.hasAiDocument(userId)) ? 'done' : 'todo',
    )
  }
}

function enrichTodo(row: Todo) {
  const definition = TODO_DEFINITIONS[row.key]
  return {
    ...row,
    title: definition?.title ?? row.title,
    description: definition?.description ?? '',
    ctaLabel: definition?.ctaLabel ?? 'Action',
    ctaTarget: definition?.ctaTarget ?? '#',
  }
}

function getDefinitionOrder(key: string) {
  const keys = Object.keys(TODO_DEFINITIONS)
  const index = keys.indexOf(key)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}
