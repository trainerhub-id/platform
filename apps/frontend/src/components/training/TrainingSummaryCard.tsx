import { Icon } from '@iconify/react'
import { trainingStaticInfo } from 'src/data/mockData'

interface TrainingSummaryCardProps {
  selectedTraining: any
}

const TrainingSummaryCard = ({ selectedTraining }: TrainingSummaryCardProps) => {
  const isOnline =
    !selectedTraining.location ||
    selectedTraining.location.toLowerCase() === 'online'

  return (
    <div
      className="bg-white rounded-[18px] border border-[#E8E2D8] p-6"
      style={{ boxShadow: '0 8px 24px rgba(31,41,55,0.04)' }}
    >
      {/* Card Title */}
      <p className="text-[16px] font-bold text-[#B8863B] mb-3">Ringkasan Training</p>

      {/* Main Heading */}
      <h2 className="text-[24px] font-bold text-[#1F2937] leading-tight mb-3">
        {selectedTraining.title}
      </h2>

      {/* Status Badges */}
      <div className="flex items-center gap-2 mb-5">
        {/* Online badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-600"
          style={{
            background: '#F5EBDD',
            color: '#6B5A3A',
            fontWeight: 600,
          }}
        >
          <Icon icon="solar:monitor-bold" height={14} />
          {isOnline ? 'Online' : 'Offline'}
        </span>

        {/* Aktif badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px]"
          style={{
            background: '#EAF7EE',
            color: '#1F8F45',
            fontWeight: 600,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: '#34A853', display: 'inline-block' }}
          />
          Aktif
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[#EFEAE2] mb-5" />

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {/* Tanggal Training */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            <Icon icon="solar:calendar-bold" className="text-[#B8863B]" height={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
              Tanggal Training
            </p>
            <p className="text-[15px] font-semibold text-[#1F2937]">
              {selectedTraining.dateStart} - {selectedTraining.dateEnd}
            </p>
          </div>
        </div>

        {/* Jam Sesi */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            <Icon icon="solar:clock-circle-bold" className="text-[#B8863B]" height={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
              Jam Sesi
            </p>
            <p className="text-[15px] font-semibold text-[#1F2937]">
              {trainingStaticInfo.sessionTime}
            </p>
          </div>
        </div>

        {/* Jam Registrasi */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            <Icon icon="solar:clock-square-bold" className="text-[#6B7280]" height={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
              Jam Registrasi
            </p>
            <p className="text-[15px] font-semibold text-[#1F2937]">
              {trainingStaticInfo.registrationTime}
            </p>
          </div>
        </div>

        {/* Alamat */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            <Icon icon="solar:monitor-bold" className="text-[#6B7280]" height={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
              Alamat
            </p>
            <p className="text-[15px] font-semibold text-[#1F2937]">
              {selectedTraining.location}
            </p>
          </div>
        </div>

        {/* Deskripsi — full width */}
        <div className="col-span-2 flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">
            <Icon icon="solar:info-circle-bold" className="text-[#6B7280]" height={18} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
              Deskripsi
            </p>
            <p className="text-[15px] text-[#4B5563] leading-relaxed">
              Program pelatihan untuk meningkatkan kemampuan para trainer dalam merancang dan
              menyampaikan pelatihan yang efektif.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingSummaryCard
