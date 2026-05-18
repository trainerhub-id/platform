import { Icon } from '@iconify/react'
import BannerBg from '/src/assets/images/home/pseudo.webp'
import CardBox from '../../shared/CardBox'

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

interface TrainingCardProps {
  batch?: any
  paymentStatus?: string | null
}

const TrainingCard = ({ batch, paymentStatus: profilePaymentStatus }: TrainingCardProps) => {
  // Calculate actual status based on real dates
  const getActualStatus = () => {
    if (!batch) return 'draft'

    const now = new Date()
    const startDate = new Date(batch.tanggal)
    const endDate = batch.tanggalSelesai ? new Date(batch.tanggalSelesai) : startDate

    // Compare dates (ignore time for accuracy)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

    if (today < start) {
      return 'upcoming'
    } else if (today >= start && today <= end) {
      return 'running'
    } else if (today > end) {
      return 'completed'
    }

    return batch.status || 'draft'
  }

  const actualStatus = getActualStatus()

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Payment Status - Left Side */}
      <div className="lg:col-span-2 md:col-span-4 col-span-12">
        {(() => {
          const paymentStatus = (
            batch?.paymentStatus ||
            profilePaymentStatus ||
            'pending'
          ).toLowerCase()
          const isPaid = paymentStatus === 'paid' || paymentStatus === 'lunas'

          return (
            <CardBox
              className={`p-6 h-full flex flex-col items-center justify-center ${
                isPaid
                  ? 'bg-gradient-to-br from-lightsuccess to-success/5'
                  : 'bg-gradient-to-br from-lightwarning to-warning/5'
              }`}
            >
              {/* Icon */}
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                  isPaid
                    ? 'bg-success/20 border-2 border-success/30'
                    : 'bg-warning/20 border-2 border-warning/30'
                }`}
              >
                <Icon
                  icon={isPaid ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'}
                  className={isPaid ? 'text-success' : 'text-warning'}
                  height={32}
                />
              </div>

              {/* Label */}
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 font-medium">
                Status Pembayaran
              </p>

              {/* Status Badge */}
              <div
                className={`px-4 py-2 rounded-md text-sm font-bold ${
                  isPaid ? 'bg-success text-white shadow-sm' : 'bg-warning text-white shadow-sm'
                }`}
              >
                {isPaid ? 'LUNAS' : 'PENDING'}
              </div>

              {/* Additional Info */}
              {!isPaid && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Menunggu konfirmasi
                </p>
              )}
            </CardBox>
          )
        })()}
      </div>

      {/* Training Banner - Right Side with Background Image */}
      <div className="lg:col-span-10 md:col-span-8 col-span-12">
        <CardBox className="p-0 overflow-hidden h-full relative">
          {/* Background Image with Gradient Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(26, 37, 55, 0.95) 0%, rgba(26, 37, 55, 0.85) 40%, rgba(26, 37, 55, 0.3) 100%), url(${BannerBg})`,
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
            {batch ? (
              <>
                <div>
                  {/* Title */}
                  <div className="mb-4">
                    <h4 className="text-2xl font-bold text-white mb-1">
                      {batch.namaBatch || 'Training Anda'}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          actualStatus === 'running'
                            ? 'bg-success/20 text-success'
                            : actualStatus === 'upcoming'
                              ? 'bg-info/20 text-info'
                              : actualStatus === 'completed'
                                ? 'bg-gray-500/20 text-gray-300'
                                : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {actualStatus === 'running'
                          ? 'Sedang Berlangsung'
                          : actualStatus === 'upcoming'
                            ? 'Akan Datang'
                            : actualStatus === 'completed'
                              ? 'Selesai'
                              : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="flex flex-wrap gap-6">
                    {/* Date */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:calendar-bold" className="text-warning" height={20} />
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-0.5">Jadwal Pelatihan</p>
                        <p className="text-sm font-semibold text-white">
                          {formatDate(batch.tanggal)}
                          {batch.tanggalSelesai && ` - ${formatDate(batch.tanggalSelesai)}`}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    {batch.hotel && (
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 bg-white/10 flex items-center justify-center flex-shrink-0">
                          <Icon icon="solar:map-point-bold" className="text-warning" height={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/60 mb-0.5">Lokasi</p>
                          <p className="text-sm font-semibold text-white">{batch.hotel}</p>
                          {batch.alamat && (
                            <p className="text-xs text-white/70 mt-0.5 break-words">
                              {batch.alamat}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <button className="flex items-center gap-2 py-2.5 px-4 bg-[#E6D6BC] text-[#8D6E33] hover:bg-[#8D6E33] hover:text-white transition-all text-sm font-semibold shadow-sm hover:shadow-md rounded-md">
                    <Icon icon="solar:book-outline" height={18} />
                    Informasi Training
                  </button>

                  {batch.mapsLink && (
                    <a
                      href={batch.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-2.5 px-4 bg-white/10 text-white hover:bg-white/20 transition-all text-sm font-semibold backdrop-blur-sm rounded-md"
                    >
                      <Icon icon="solar:map-arrow-right-outline" height={18} />
                      Buka Maps
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Icon
                  icon="solar:clipboard-list-outline"
                  className="text-white/40 mb-4"
                  height={48}
                />
                <h5 className="text-lg font-semibold text-white mb-2">Belum Ada Training Aktif</h5>
                <p className="text-sm text-white/60 max-w-md">
                  Anda belum terdaftar dalam batch training. Silakan hubungi admin untuk informasi
                  lebih lanjut.
                </p>
              </div>
            )}
          </div>
        </CardBox>
      </div>
    </div>
  )
}

export default TrainingCard
