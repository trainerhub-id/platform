import { Icon } from '@iconify/react'
import { UserAvatar } from 'src/components/avatar'
import { trainingStaticInfo } from 'src/data/mockData'

interface TrainingDetailTabProps {
  selectedTraining: any
}

const TrainingDetailTab = ({ selectedTraining }: TrainingDetailTabProps) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
      {/* Left: Main Detail Info */}
      <div className="space-y-6">
        {/* Participant Header */}
        <div className="flex items-center gap-4">
          <UserAvatar
            userId={selectedTraining.participant.userId || 'participant'}
            size={52}
            alt={selectedTraining.participant.name}
            className="w-13 h-13 rounded-full border-2 border-[#E8E2D8] shadow-sm object-cover flex-shrink-0"
          />
          <div>
            <h4 className="text-[17px] font-bold text-[#1F2937] leading-tight">
              {selectedTraining.participant.name}
            </h4>
            <p className="text-[13px] text-[#9CA3AF]">Informasi Profile user</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#EFEAE2]" />

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {/* Nama Batch */}
          <div className="flex items-start gap-3">
            <Icon icon="solar:diploma-bold" className="text-[#B8863B] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Nama Batch
              </p>
              <p className="text-[15px] font-semibold text-[#1F2937]">{selectedTraining.title}</p>
            </div>
          </div>

          {/* Tanggal Training */}
          <div className="flex items-start gap-3">
            <Icon icon="solar:calendar-bold" className="text-[#B8863B] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Tanggal Training
              </p>
              <p className="text-[15px] font-semibold text-[#1F2937]">
                {selectedTraining.dateStart} - {selectedTraining.dateEnd}
              </p>
            </div>
          </div>

          {/* Alamat */}
          <div className="flex items-start gap-3">
            <Icon icon="solar:map-point-bold" className="text-[#6B7280] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Alamat
              </p>
              <p className="text-[15px] font-semibold text-[#1F2937]">
                {selectedTraining.location}
              </p>
            </div>
          </div>

          {/* Jam Registrasi */}
          <div className="flex items-start gap-3">
            <Icon icon="solar:clock-square-bold" className="text-[#6B7280] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Jam Registrasi
              </p>
              <p className="text-[15px] font-semibold text-[#1F2937]">
                {trainingStaticInfo.registrationTime}
              </p>
            </div>
          </div>

          {/* Jam Sesi */}
          <div className="flex items-start gap-3">
            <Icon icon="solar:clock-circle-bold" className="text-[#6B7280] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Jam Sesi
              </p>
              <p className="text-[15px] font-semibold text-[#1F2937]">
                {trainingStaticInfo.sessionTime}
              </p>
            </div>
          </div>

          {/* Status Pembayaran */}
          <div className="flex items-start gap-3">
            <Icon icon="solar:card-bold" className="text-[#6B7280] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Status Pembayaran
              </p>
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-semibold"
                style={
                  selectedTraining.paymentStatus === 'Lunas'
                    ? { background: '#EAF7EE', color: '#1F8F45' }
                    : { background: '#FEF3C7', color: '#92400E' }
                }
              >
                {selectedTraining.paymentStatus || 'Pending'}
              </span>
            </div>
          </div>

          {/* Kelengkapan — full width */}
          <div className="sm:col-span-2 flex items-start gap-3">
            <Icon icon="solar:clipboard-list-bold" className="text-[#6B7280] mt-0.5 flex-shrink-0" height={18} />
            <div>
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
                Kelengkapan yang Perlu Dibawa
              </p>
              <p className="text-[15px] text-[#4B5563] leading-relaxed">
                {trainingStaticInfo.requirements}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Trainer Card */}
      <div
        className="rounded-[16px] border border-[#E8E2D8] p-[22px]"
        style={{ background: '#FBF9F5' }}
      >
        {/* Trainer Card Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#EFEAE2]">
          <Icon icon="solar:user-rounded-bold" className="text-[#B8863B]" height={18} />
          <span className="text-[13px] font-bold text-[#1F2937] uppercase tracking-wide">
            Informasi Trainer
          </span>
        </div>

        {/* Trainer Profile */}
        <div className="flex items-center gap-3 mb-4">
          <UserAvatar
            userId={selectedTraining.trainer.userId || selectedTraining.trainer.id || 'trainer'}
            size={44}
            alt={selectedTraining.trainer.name}
            className="w-11 h-11 rounded-full object-cover border border-[#E8E2D8] flex-shrink-0"
          />
          <div>
            <h5 className="text-[15px] font-bold text-[#1F2937] leading-tight">
              {selectedTraining.trainer.name}
            </h5>
            <p className="text-[12px] text-[#9CA3AF] font-semibold">
              {selectedTraining.trainer.position}
            </p>
          </div>
        </div>

        {/* Trainer Message */}
        <div className="space-y-2">
          <p className="text-[14px] text-[#1F2937] leading-relaxed">
            Hello {selectedTraining.trainer.name},
          </p>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            {selectedTraining.trainer.bio || 'No biography available for this trainer.'}
          </p>
          <div className="pt-2 border-t border-[#EFEAE2]">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-0.5">
              Regards,
            </p>
            <p className="text-[14px] font-bold text-[#1F2937]">
              {selectedTraining.trainer.assignedBy || 'Admin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingDetailTab
