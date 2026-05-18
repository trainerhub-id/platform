import type { NewTodo, Todo } from '../db/schema'
import { TODO_DEFINITIONS } from './todo-definitions'
import { TodosRepository } from './todos.repository'

type TodoStatus = 'todo' | 'in_progress' | 'waiting_review' | 'done'

export class TodosService {
  constructor(private readonly repository = new TodosRepository()) {}

  async initializeTodosForUser(userId: string, batchId?: string) {
    const profile = await this.repository.ensurePesertaForUser(userId)
    if (!profile?.id) return []

    const definitions = Object.values(TODO_DEFINITIONS).filter(
      (definition) => definition.role === 'participant',
    )
    const values: NewTodo[] = definitions.map((definition) => ({
      userId: profile.id,
      batchId,
      key: definition.key,
      title: definition.title,
      category: definition.category,
      status: 'todo',
      isBlocking: definition.isBlocking ?? false,
      meta: {},
    }))
    await this.repository.pruneUserTodosToKeys(
      profile.id,
      definitions.map((definition) => definition.key),
    )
    const created = await this.repository.insertMissing(values)
    await this.repository.updateDefinitionMetadata(profile.id, values)

    await this.syncTodosWithProfileState(userId)
    return created
  }

  async initializeTodosForBatch(batchId?: string) {
    const definitions = Object.values(TODO_DEFINITIONS).filter(
      (definition) => definition.role === 'admin',
    )
    return this.repository.insertMany(
      definitions.map((definition) => ({
        userId: null,
        batchId,
        key: definition.key,
        title: definition.title,
        category: definition.category,
        status: 'todo',
        isBlocking: definition.isBlocking ?? false,
        meta: {},
      })),
    )
  }

  async getTodosForUser(userId: string) {
    const profile = await this.repository.ensurePesertaForUser(userId)
    if (!profile?.id) return []

    await this.initializeTodosForUser(userId)
    await this.syncTodosWithProfileState(userId)
    let rows = await this.repository.findByUserId(profile.id)

    return rows
      .sort((a, b) => getDefinitionOrder(a.key) - getDefinitionOrder(b.key))
      .map(enrichTodo)
  }

  async getTodosForBatch(batchId?: string) {
    const rows = await this.repository.findAdmin(batchId)
    return rows.map(enrichTodo)
  }

  async updateTodoStatus(id: string, status: TodoStatus) {
    return this.repository.updateStatus(id, status)
  }

  async syncTodosWithProfileState(userId: string) {
    const profile = await this.repository.ensurePesertaForUser(userId)
    if (!profile?.id) return

    const hasPaidAccess =
      profile.paymentStatus === 'paid' || (await this.repository.hasPaidEnrollment(profile.id))
    await this.repository.setStatusByKey(
      profile.id,
      'lakukan_pembayaran',
      hasPaidAccess ? 'done' : 'todo',
    )
    await this.repository.setStatusByKey(
      profile.id,
      'selesaikan_kelas',
      (await this.repository.hasCompletedLesson(profile.id)) ? 'done' : 'todo',
    )
    await this.repository.setStatusByKey(
      profile.id,
      'upload_dokumen',
      (await this.repository.hasUploadedDocument(profile.id)) ? 'done' : 'todo',
    )
    await this.repository.setStatusByKey(
      profile.id,
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
