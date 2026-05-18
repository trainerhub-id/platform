import { useContext } from 'react'
import { CustomizerContext } from '../../../context/CustomizerContext'
import CardBox from '../../shared/CardBox'
import { Button } from '../../ui/button'
import { Checkbox } from '../../ui/checkbox'

interface ProgressTasksProps {
  tasks: any[]
  submissions: any[]
}

const ProgressTasks = ({ tasks = [], submissions = [] }: ProgressTasksProps) => {
  const { isBorderRadius } = useContext(CustomizerContext)

  const getTaskStatus = (tugasId: string) => {
    const submission = submissions.find((s) => s.tugasId === tugasId)
    return !!submission // true if submitted
  }

  return (
    <CardBox>
      <h4 className="text-lg font-semibold text-ld mb-6">Progres Tugas</h4>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-bodytext">Belum ada tugas.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-4 border border-ld"
              style={{ borderRadius: `${isBorderRadius}px` }}
            >
              <Checkbox
                id={`task-${task.id}`}
                checked={getTaskStatus(task.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor={`task-${task.id}`}
                  className="text-sm font-medium text-ld block mb-1 cursor-pointer"
                >
                  {task.judul || task.title}
                </label>
                <p className="text-xs text-bodytext">
                  {task.deskripsi || task.description || 'Tidak ada deskripsi'}
                </p>
              </div>
              <Button
                variant="outline"
                size="xs"
                className={`shrink-0 border-info font-bold ${getTaskStatus(task.id) ? 'bg-success text-white border-success' : 'bg-info text-white hover:bg-transparent hover:text-info'}`}
              >
                {getTaskStatus(task.id) ? 'Selesai' : 'Mulai'}
              </Button>
            </div>
          ))
        )}
      </div>
    </CardBox>
  )
}

export default ProgressTasks
