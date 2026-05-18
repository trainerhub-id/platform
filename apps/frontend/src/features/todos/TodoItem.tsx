import { IconSquareRounded, IconSquareRoundedCheckFilled } from '@tabler/icons-react'
import React from 'react'
import { useNavigate } from 'react-router'
import { TodoItem as ITodoItem } from './useTodos'

interface Props {
  item: ITodoItem
}

export const TodoItem: React.FC<Props> = ({ item }) => {
  const navigate = useNavigate()

  const isDone = item.status === 'done'

  return (
    <div className="flex items-start gap-4 p-4 border border-gray-100 hover:bg-gray-50 transition-all duration-200 rounded-xl bg-white mb-3 shadow-none">
      {/* Checkbox Icon */}
      <div className={`mt-0.5 flex-shrink-0 ${isDone ? 'text-blue-500' : 'text-gray-300'}`}>
        {isDone ? (
          <IconSquareRoundedCheckFilled size={24} className="text-[var(--color-primary)]" />
        ) : (
          <IconSquareRounded size={24} stroke={1.5} />
        )}
      </div>

      {/* Content & Action */}
      <div className="flex flex-col gap-1.5 flex-1">
        <div>
          <h4 className={`font-semibold text-gray-800 text-sm ${isDone ? 'text-gray-500' : ''}`}>
            {item.title}
          </h4>
          {item.description && (
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.description}</p>
          )}
        </div>

        <div className="mt-0.5">
          {isDone ? (
            <button
              className="text-[10px] font-semibold uppercase tracking-wider text-white bg-[var(--color-primary)] px-2 py-0.5 rounded-md cursor-default"
              disabled
            >
              Selesai
            </button>
          ) : (
            <button
              onClick={() => navigate(item.ctaTarget)}
              className="text-[10px] md:text-xs font-semibold text-red-500 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors inline-flex items-center gap-1 uppercase tracking-wider"
            >
              Selesaikan Sekarang &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
