import { Icon } from '@iconify/react'
import { Loading } from 'src/components/ui/loading'
import { useSertifikat } from './hooks/useSertifikat'

function StatusBadge({ available }: { available: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span
        className={`w-2 h-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-[#C9A84C]'}`}
      />
      {available ? 'Tersedia' : 'Belum Tersedia'}
    </span>
  )
}

function RequirementItem({ text, done }: { text: string; done?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          done ? 'bg-[#C9A84C] text-white' : 'bg-[#F5EFE0] text-[#C9A84C]'
        }`}
      >
        <Icon icon="solar:check-read-linear" height={12} />
      </span>
      <span className="text-sm text-gray-600">{text}</span>
    </li>
  )
}

function CertPreviewLocked() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[220px] rounded-2xl border-2 border-dashed border-[#E8DFC9] bg-[#FDFBF7] p-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5EFE0]">
        <Icon icon="solar:lock-keyhole-bold-duotone" height={22} className="text-[#C9A84C]" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">Sertifikat belum tersedia</p>
      <p className="text-xs text-gray-400 max-w-[200px]">
        Selesaikan seluruh persyaratan untuk membuka sertifikat.
      </p>
    </div>
  )
}

function CertificateCard({
  title,
  description,
  available,
  infoBanner,
  requirements,
  downloadUrl,
}: {
  title: string
  description: string
  available: boolean
  infoBanner: string
  requirements: { text: string; done?: boolean }[]
  downloadUrl?: string | null
}) {
  return (
    <div className="rounded-[20px] border border-[#EDE8DC] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#1E293B]">{title}</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">{description}</p>
        </div>
        <StatusBadge available={available} />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-5">
        {/* Left: info + requirements */}
        <div className="lg:col-span-3 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl bg-[#FBF8F1] border border-[#EDE8DC] px-4 py-3">
            <Icon
              icon="solar:info-circle-bold-duotone"
              height={18}
              className="text-[#C9A84C] mt-0.5 shrink-0"
            />
            <p className="text-sm text-gray-600">{infoBanner}</p>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-sm font-semibold text-[#1E293B] mb-3">Persyaratan</h4>
            <ul className="space-y-2.5">
              {requirements.map((req, i) => (
                <RequirementItem key={i} text={req.text} done={req.done} />
              ))}
            </ul>
          </div>

          {/* Download button */}
          <button
            disabled={!available}
            onClick={() => downloadUrl && window.open(downloadUrl, '_blank')}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              available
                ? 'bg-[#C9A84C] text-white hover:bg-[#B8963F] shadow-sm'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
          >
            <Icon icon="solar:download-minimalistic-bold" height={16} />
            Download (PDF)
          </button>
        </div>

        {/* Right: preview */}
        <div className="lg:col-span-2">
          {available ? (
            <div className="rounded-2xl border border-[#EDE8DC] bg-[#FDFBF7] p-4 flex items-center justify-center min-h-[220px]">
              <Icon icon="solar:diploma-verified-bold-duotone" height={64} className="text-[#C9A84C]" />
            </div>
          ) : (
            <CertPreviewLocked />
          )}
        </div>
      </div>
    </div>
  )
}

const Sertifikat = () => {
  const { certificates, loading } = useSertifikat()

  if (loading) {
    return <Loading fullPage />
  }

  const bnspCerts = certificates.filter((c) => c.certType === 'bnsp')
  const trainerHubCerts = certificates.filter((c) => c.certType === 'trainerhub')

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Sertifikat</h1>
        <p className="text-sm text-gray-500 mt-1">
          Temukan sertifikat yang sudah tersedia dan yang akan segera Anda dapatkan.
        </p>
      </div>

      {/* Card 1: TrainerHub */}
      <CertificateCard
        title="Sertifikat TrainerHub"
        description="Sertifikat kelulusan internal TrainerHub yang diberikan setelah Anda menyelesaikan seluruh materi dan evaluasi."
        available={trainerHubCerts.length > 0}
        infoBanner="Sertifikat diterbitkan otomatis setelah menyelesaikan seluruh materi kelas."
        requirements={[
          { text: 'Selesaikan seluruh materi kelas', done: false },
          { text: 'Capai minimal 70% pada evaluasi akhir', done: false },
          { text: 'Isi profil dan data diri dengan lengkap', done: false },
        ]}
        downloadUrl={trainerHubCerts[0]?.fileUrl}
      />

      {/* Card 2: BNSP */}
      <CertificateCard
        title="Sertifikat BNSP"
        description="Sertifikat kompetensi resmi dari BNSP yang diterbitkan setelah Anda lulus uji kompetensi."
        available={bnspCerts.length > 0}
        infoBanner="Sertifikat diterbitkan setelah Anda dinyatakan kompeten oleh asesor BNSP."
        requirements={[
          { text: 'Lulus uji kompetensi BNSP', done: false },
          { text: 'Verifikasi data diri dan dokumen pendukung', done: false },
          { text: 'Pembayaran biaya sertifikasi jika diperlukan', done: false },
        ]}
        downloadUrl={bnspCerts[0]?.fileUrl}
      />
    </div>
  )
}

export default Sertifikat
