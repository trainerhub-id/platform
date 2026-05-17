import { Icon } from '@iconify/react'
import { useState } from 'react'
import CardBox from 'src/components/shared/CardBox'
import CertificateDetailCard from 'src/components/shared/CertificateDetailCard'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { useSertifikat } from './hooks/useSertifikat'

const Sertifikat = () => {
  const { certificates, eligibleCourses, loading, generating, generateCertificate } =
    useSertifikat()
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  if (loading) {
    return <Loading fullPage />
  }

  const bnspCerts = certificates.filter((c) => c.certType === 'bnsp')
  const trainerHubCerts = certificates.filter((c) => c.certType === 'trainerhub')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6">
          <CardBox className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FFF4E5] flex items-center justify-center text-warning shrink-0">
                <Icon icon="solar:diploma-verified-linear" height={24} />
              </div>
              <div>
                <p className="text-xs text-bodytext mb-0.5">Status Sertifikasi BNSP</p>
                <h4 className="font-bold text-dark">
                  {bnspCerts.length > 0 ? 'Terbit' : 'Belum Terbit'}
                </h4>
              </div>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${bnspCerts.length > 0 ? 'bg-success' : 'bg-bodytext/30'}`}
            ></div>
          </CardBox>
        </div>
        <div className="col-span-12 md:col-span-6">
          <CardBox className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon icon="solar:diploma-linear" height={24} />
              </div>
              <div>
                <p className="text-xs text-bodytext mb-0.5">Sertifikat TrainerHub</p>
                <h4 className="font-bold text-dark">{trainerHubCerts.length} Sertifikat</h4>
              </div>
            </div>
            <div
              className={`w-3 h-3 rounded-full ${trainerHubCerts.length > 0 ? 'bg-success' : 'bg-bodytext/30'}`}
            ></div>
          </CardBox>
        </div>
      </div>

      {/* TrainerHub Certificates */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-dark">Sertifikat Kelas</h3>

        {/* Show Generate Certificate Option if there are eligible courses */}
        {eligibleCourses.some((c) => !c.hasCertificate) && (
          <CardBox className="p-5 bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Icon icon="solar:diploma-linear" className="text-blue-600" height={24} />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-semibold text-dark mb-1">Kelas Selesai!</h4>
                  <p className="text-sm text-bodytext">
                    Kamu telah menyelesaikan kelas. Pilih kelas untuk membuat sertifikat:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleCourses
                        .filter((c) => !c.hasCertificate)
                        .map((course) => (
                          <SelectItem key={course.courseId} value={course.courseId}>
                            {course.courseName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => selectedCourseId && generateCertificate(selectedCourseId)}
                    disabled={!selectedCourseId || generating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {generating ? (
                      <>
                        <Icon
                          icon="solar:refresh-linear"
                          className="mr-2 animate-spin"
                          height={18}
                        />
                        Membuat Sertifikat...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:diploma-verified-bold" className="mr-2" height={18} />
                        Buat Sertifikat
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardBox>
        )}

        {/* Certificates or Placeholder */}
        {trainerHubCerts.length > 0 ? (
          trainerHubCerts.map((cert) => (
            <CertificateDetailCard
              key={cert.id}
              title={cert.title}
              status="Terbit"
              isReady={true}
              details={[
                { label: 'Nomor Sertifikat', value: cert.certificateNumber },
                { label: 'Tanggal Selesai', value: cert.date },
              ]}
              downloadUrl={cert.file}
              certificateUrl={cert.certificateUrl}
            />
          ))
        ) : (
          <CertificateDetailCard
            title="Sertifikat TrainerHub"
            status="Belum Tersedia"
            isReady={false}
            details={[]}
            alertMessage="Sertifikat diterbitkan otomatis setelah menyelesaikan seluruh materi kelas."
          />
        )}
      </div>

      {/* BNSP Certificates */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-dark">Sertifikat BNSP</h3>
        {bnspCerts.length > 0 ? (
          bnspCerts.map((cert) => (
            <CertificateDetailCard
              key={cert.id}
              title={cert.title || 'Sertifikat BNSP'}
              status="Terbit"
              isReady={true}
              isOfficial={true}
              details={[
                { label: 'Nomor Sertifikat', value: cert.certificateNumber || '-' },
                { label: 'LSP Penerbit', value: cert.issuer || 'BNSP' },
                { label: 'Tanggal Terbit', value: cert.date },
              ]}
              downloadUrl={cert.file}
              certificateUrl={cert.certificateUrl}
            />
          ))
        ) : (
          <CertificateDetailCard
            title="Sertifikat BNSP"
            status="Belum Tersedia"
            isReady={false}
            details={[]}
            alertMessage="Sertifikat BNSP akan diterbitkan setelah menyelesaikan program dan lulus uji kompetensi."
          />
        )}
      </div>
    </div>
  )
}

export default Sertifikat
