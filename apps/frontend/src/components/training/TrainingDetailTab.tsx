import { Icon } from '@iconify/react'
import { UserAvatar } from 'src/components/avatar'
import CardBox from 'src/components/shared/CardBox'
import { Button } from 'src/components/ui/button'
import { trainingStaticInfo } from 'src/data/mockData'

interface TrainingDetailTabProps {
  selectedTraining: any
}

const TrainingDetailTab = ({ selectedTraining }: TrainingDetailTabProps) => {
  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Left Column (Main Info) */}
      <div className="2xl:col-span-8 col-span-12 space-y-8">
        {/* Participant Info */}
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <UserAvatar
              userId={selectedTraining.participant.userId || 'participant'}
              size={56}
              alt={selectedTraining.participant.name}
              className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover"
            />
          </div>
          <div>
            <h4 className="text-lg font-bold text-dark mb-0">
              {selectedTraining.participant.name}
            </h4>
            <p className="text-lightmuted text-sm">Informasi Profile user</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-lightmuted text-[11px] mb-1 font-bold uppercase tracking-wider">
              Nama batch
            </p>
            <h5 className="text-sm font-bold text-dark">{selectedTraining.title}</h5>
          </div>
          <div>
            <p className="text-lightmuted text-[11px] mb-1 font-bold uppercase tracking-wider">
              Tanggal training
            </p>
            <h5 className="text-sm font-bold text-dark">
              {selectedTraining.dateStart} - {selectedTraining.dateEnd}
            </h5>
          </div>
          <div className="col-span-2">
            <p className="text-lightmuted text-[11px] mb-1 font-bold uppercase tracking-wider">
              Address
            </p>
            <h5 className="text-sm font-bold text-dark leading-normal">
              {selectedTraining.location}
            </h5>
          </div>
          <div>
            <p className="text-lightmuted text-[11px] mb-1 font-bold uppercase tracking-wider">
              Jam registrasi
            </p>
            <h5 className="text-sm font-bold text-dark">
              {trainingStaticInfo.registrationTime}
            </h5>
          </div>
          <div>
            <p className="text-lightmuted text-[11px] mb-1 font-bold uppercase tracking-wider">
              Jam sesi
            </p>
            <h5 className="text-sm font-bold text-dark">{trainingStaticInfo.sessionTime}</h5>
          </div>
          <div className="col-span-2">
            <p className="text-lightmuted text-[11px] mb-1 font-bold uppercase tracking-wider">
              Kelengkapan. Apa yang Perlu Dibawa
            </p>
            <h5 className="text-sm font-medium text-dark leading-relaxed">
              {trainingStaticInfo.requirements}
            </h5>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button className="bg-lightinfo hover:bg-[#D6E8FF] text-info font-bold rounded-xl px-4 py-2 h-auto text-xs shadow-none transition-all border-none outline-none">
            Cek Status Pembayaran: {selectedTraining.paymentStatus || 'PENDING'}
          </Button>
          <Button
            variant="outline"
            className="border-gray-200 text-dark font-bold rounded-xl px-4 py-2 h-auto text-xs hover:bg-lightgray transition-all"
          >
            Panitia
          </Button>
        </div>
      </div>

      {/* Right Column (Trainer Box) */}
      <div className="2xl:col-span-4 col-span-12">
        <CardBox className="bg-lightgray border-ld shadow-none!">
          <div className="px-3 py-2 border-b border-ld flex items-center gap-2">
            <Icon icon="solar:user-rounded-bold" className="text-lightmuted" height={18} />
            <span className="text-[11px] font-bold text-dark uppercase tracking-wider">
              Informasi Trainer
            </span>
          </div>
          <div className="p-3 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <UserAvatar
                  userId={
                    selectedTraining.trainer.userId || selectedTraining.trainer.id || 'trainer'
                  }
                  size={48}
                  alt={selectedTraining.trainer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div>
                <h5 className="text-base font-bold text-dark mb-0">
                  {selectedTraining.trainer.name}
                </h5>
                <p className="text-lightmuted text-xs font-bold">
                  {selectedTraining.trainer.position}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-dark text-sm leading-relaxed">
                Hello {selectedTraining.trainer.name},
              </p>
              <p className="text-dark text-xs leading-relaxed opacity-80">
                {selectedTraining.trainer.bio || 'No biography available for this trainer.'}
              </p>
              <div className="pt-1">
                <p className="text-lightmuted text-[10px] mb-0.5 font-bold uppercase tracking-wider">
                  Regards,
                </p>
                <h5 className="text-sm font-bold text-dark">
                  {selectedTraining.trainer.assignedBy || 'Admin'}
                </h5>
              </div>
            </div>
          </div>
        </CardBox>
      </div>
    </div>
  )
}

export default TrainingDetailTab
