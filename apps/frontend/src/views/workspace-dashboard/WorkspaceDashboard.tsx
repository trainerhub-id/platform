import { useWorkspace } from '../../context/WorkspaceContext'

export default function WorkspaceDashboard() {
  const workspace = useWorkspace()

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">{workspace.displayName}</h1>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Slug</dt>
          <dd><code className="bg-gray-100 px-1 rounded">{workspace.slug}</code></dd>
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
      <p className="mt-8 text-sm text-gray-400">
        Halaman dashboard ini placeholder. Konten lengkap (kelas, dokumen, sertifikat, todos) akan muncul di Phase 2.
      </p>
    </div>
  )
}
