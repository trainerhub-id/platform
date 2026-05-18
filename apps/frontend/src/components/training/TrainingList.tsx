import { Icon } from '@iconify/react'
import CardBox from 'src/components/shared/CardBox'
import { Button } from 'src/components/ui/button'

interface TrainingListProps {
  trainings: any[]
  selectedId: string
  onSelect: (training: any) => void
}

const TrainingList = ({ trainings, selectedId, onSelect }: TrainingListProps) => {
  return (
    <div className="space-y-4 max-h-[700px] max-w-md overflow-y-auto p-4 custom-scrollbar">
      {trainings.map((training, index) => (
        <CardBox
          key={training.id}
          className={`cursor-pointer p-0 overflow-hidden border rounded-2xl ${
            selectedId === training.id
              ? 'border-[var(--color-gold)] ring-1 ring-[var(--color-gold)]/20 bg-white'
              : 'border-gray-200 bg-white'
          }`}
          onClick={() => onSelect(training)}
        >
          <div className="px-4 py-3 border-b border-ld flex items-center justify-between">
            <h5 className="font-bold text-[var(--color-gold)] text-base">Training #0{index + 1}</h5>
            <button className="text-bodytext">
              <Icon icon="solar:menu-dots-vertical-bold" height={20} />
            </button>
          </div>

          <div className="px-0 relative">
            {training.image ? (
              <img
                src={training.image}
                alt={training.title}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div
              className={`w-full h-32 bg-gradient-to-br from-[#F8F4ED] to-[#EDE5D8] flex items-center justify-center ${training.image ? 'hidden' : ''}`}
            >
              <Icon
                icon="solar:calendar-minimalistic-bold"
                className="text-[#C4B596]"
                height={44}
              />
            </div>
          </div>

          <div className="px-4 py-3">
            <p className="text-sm text-bodytext leading-relaxed mb-3">
              {training.title}, {training.location}.
            </p>

            <div className="border-t border-ld pt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-bodytext font-medium">
                <Icon icon="solar:calendar-outline" height={18} />
                <span className="text-[11px]">
                  {training.dateStart} - {training.dateEnd}
                </span>
              </div>
              <Button className="bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90 text-white rounded-xl px-4 py-1.5 h-auto text-[10px] font-bold shadow-none transition-colors border-none outline-none uppercase tracking-wider">
                Lihat Detail
              </Button>
            </div>
          </div>
        </CardBox>
      ))}
    </div>
  )
}

export default TrainingList
