import { Icon } from '@iconify/react'

interface TrainingRundownTabProps {
  rundown: any[]
}

const TrainingRundownTab = ({ rundown }: TrainingRundownTabProps) => {
  return (
    <div className="pt-4 px-2">
      <h4 className="text-xl font-bold text-[#1A2537] mb-8">Rundown Acara</h4>

      <div className="relative space-y-0">
        {/* Vertical Line */}
        <div className="absolute left-[76px] top-2 bottom-2 w-[1px] bg-gray-100"></div>

        {rundown &&
          rundown.map((item: any, idx: number) => (
            <div key={idx} className="relative flex items-center mb-10 last:mb-0">
              {/* Time */}
              <div className="w-[60px] text-sm font-medium text-gray-400 text-left shrink-0">
                {item.time}
              </div>

              {/* Dot Container */}
              <div className="w-8 flex justify-center items-center shrink-0">
                <div
                  className="relative z-10 w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
              </div>

              {/* Event Name */}
              <div className="pl-6 text-sm font-semibold text-gray-400">{item.event}</div>
            </div>
          ))}

        {(!rundown || rundown.length === 0) && (
          <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="text-center py-6">
              <Icon
                icon="solar:document-text-outline"
                className="mx-auto mb-3 text-gray-300"
                height={48}
              />
              <h4 className="text-base font-bold text-gray-400">Jadwal Rundown Belum Tersedia</h4>
              <p className="text-sm text-gray-400">
                Silakan pilih batch lain atau hubungi panitia.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainingRundownTab
