import { IconLoader, IconRefresh } from '@tabler/icons-react'
import React from 'react'
import { TodoItem } from './TodoItem'
import { useTodos } from './useTodos'

interface Props {
  batchId?: string
  isAdmin?: boolean
}

export const TodoList: React.FC<Props> = ({ batchId, isAdmin = false }) => {
  const { todos, loading, error, refresh } = useTodos(batchId, isAdmin)

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        <IconLoader className="animate-spin mx-auto mb-2 text-blue-600" /> Loading tasks...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading tasks. Please try again later.
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="py-2">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Progres Tugas</h2>
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Belum ada tugas untuk ditampilkan.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Progres Tugas</h2>
        </div>
        <button
          onClick={refresh}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh"
        >
          <IconRefresh size={18} />
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
        {todos.map((item) => (
          <TodoItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
