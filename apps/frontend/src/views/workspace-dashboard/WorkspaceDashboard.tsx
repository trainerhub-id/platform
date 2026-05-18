import { useWorkspace } from '../../context/WorkspaceContext'
import { TodoList } from '../../features/todos/TodoList'

export default function WorkspaceDashboard() {
  const workspace = useWorkspace()

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-bold mb-4">{workspace.displayName}</h1>
      <dl className="grid grid-cols-2 gap-4 text-sm mb-8">
        <div>
          <dt className="text-gray-500">Slug</dt>
          <dd>
            <code className="bg-gray-100 px-1 rounded">{workspace.slug}</code>
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd>{workspace.status}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Dibuat</dt>
          <dd>{new Date(workspace.createdAt).toLocaleDateString('id-ID')}</dd>
        </div>
      </dl>
      <TodoList />
    </div>
  )
}
