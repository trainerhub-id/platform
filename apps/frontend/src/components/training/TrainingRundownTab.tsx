import { Icon } from '@iconify/react'

interface TrainingRundownTabProps {
  rundown: any[]
}

const TrainingRundownTab = ({ rundown }: TrainingRundownTabProps) => {
  if (!rundown || rundown.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-[#E8E2D8] bg-[#FBF9F5] p-10">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-[#F5EBDD] flex items-center justify-center mb-3">
            <Icon icon="solar:document-text-bold" className="text-[#B8863B]" height={28} />
          </div>
          <h4 className="text-[15px] font-bold text-[#1F2937] mb-1">
            Jadwal Rundown Belum Tersedia
          </h4>
          <p className="text-[13px] text-[#9CA3AF]">
            Silakan hubungi panitia untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-2 px-2">
      <div className="relative">
        {/* Vertical connector line */}
        <div
          className="absolute left-[88px] top-3 bottom-3 w-px"
          style={{ background: '#EFEAE2' }}
        />

        <div className="space-y-0">
          {rundown.map((item: any, idx: number) => (
            <div key={`${item.time}-${idx}`} className="relative flex items-center mb-8 last:mb-0">
              {/* Time */}
              <div className="w-[72px] text-[13px] font-semibold text-[#9CA3AF] text-right pr-4 shrink-0">
                {item.time}
              </div>

              {/* Dot */}
              <div className="w-8 flex justify-center items-center shrink-0 relative z-10">
                <div
                  className="w-3 h-3 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: item.color || '#B8863B',
                    boxShadow: `0 0 0 3px ${(item.color || '#B8863B')}22`,
                  }}
                />
              </div>

              {/* Event */}
              <div className="pl-4 flex-1">
                <p className="text-[15px] font-semibold text-[#1F2937]">{item.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TrainingRundownTab
