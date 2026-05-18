import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { ButtonLoading, Loading } from 'src/components/ui/loading'
import api from '../../../api/axios'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'

interface ParticipantDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participantId: string | null
}

interface DocumentItem {
  id: string
  jenisId: string
  jenisNama?: string
  fileUrl: string
  status: 'pending' | 'approved' | 'revisi'
  catatanRevisi?: string
  createdAt: string
}

interface ProfileData {
  noWa?: string
  nik?: string
  ttl?: string
  jk?: string
  alamat?: string
  kota?: string
  provinsi?: string
  pendidikan?: string
  pekerjaan?: string
  tShirtSize?: string
  dataBnspStatus?: string
}

interface ProgressData {
  pesertaId: string
  nama: string
  email: string
  documents: {
    total: number
    pending: number
    approved: number
    revisi: number
    items?: DocumentItem[]
  }
  tasks: {
    total: number
    completed: number
    pending: number
  }
  aiGenerations: number
  hasCertificate: boolean
  profile?: ProfileData
}

export const ParticipantDetailModal = ({
  open,
  onOpenChange,
  participantId,
}: ParticipantDetailModalProps) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ProgressData | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [reviewingDoc, setReviewingDoc] = useState<string | null>(null)
  const [bnspCertificate, setBnspCertificate] = useState<any>(null)
  const [uploadingBnsp, setUploadingBnsp] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  useEffect(() => {
    if (open && participantId) {
      fetchAllParticipantData()
    }
  }, [open, participantId])

  const fetchAllParticipantData = async () => {
    if (!participantId) return

    setLoading(true)

    const [progressResult, documentsResult, bnspResult] = await Promise.allSettled([
      api.get(`/admin/peserta/${participantId}/progress`),
      api.get(`/dokumen/peserta/${participantId}`),
      api.get(`/sertifikat/peserta/${participantId}/bnsp`),
    ])

    if (progressResult.status === 'fulfilled') {
      setData(progressResult.value.data)
    } else {
      console.error('Error fetching participant details:', progressResult.reason)
      toast.error('Gagal memuat detail peserta')
    }

    if (documentsResult.status === 'fulfilled') {
      setDocuments(documentsResult.value.data || [])
    } else {
      console.error('Error fetching documents:', documentsResult.reason)
    }

    if (bnspResult.status === 'fulfilled') {
      setBnspCertificate(bnspResult.value.data)
    } else {
      console.error('Error fetching BNSP certificate:', bnspResult.reason)
    }

    setLoading(false)
  }

  const handleApproveDocument = async (docId: string) => {
    setReviewingDoc(docId)
    try {
      await api.patch(`/dokumen/${docId}/approve`)
      toast.success('Dokumen berhasil disetujui')
      await fetchAllParticipantData()
    } catch (error) {
      toast.error('Gagal menyetujui dokumen')
    } finally {
      setReviewingDoc(null)
    }
  }

  const handleRevisiDocument = async (docId: string) => {
    const catatan = prompt('Masukkan catatan revisi:')
    if (!catatan) return

    setReviewingDoc(docId)
    try {
      await api.patch(`/dokumen/${docId}/revisi`, { catatan })
      toast.success('Permintaan revisi berhasil dikirim')
      await fetchAllParticipantData()
    } catch (error) {
      toast.error('Gagal mengirim permintaan revisi')
    } finally {
      setReviewingDoc(null)
    }
  }

  const handleUploadBnspCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !participantId) return

    console.log('Starting BNSP certificate upload...', { fileName: file.name, size: file.size })
    setUploadingBnsp(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pesertaId', participantId)

    try {
      const response = await api.post('/sertifikat/bnsp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      console.log('Upload success!', response.data)
      toast.success('✅ Sertifikat BNSP berhasil diunggah!')
      await fetchAllParticipantData()
      setUploadSuccess(true)
      // Reset file input
      e.target.value = ''
    } catch (error: any) {
      console.error('Upload BNSP certificate failed', error)
      console.error('Error response:', error.response?.data)
      const errorMsg = error.response?.data?.message || 'Gagal mengunggah sertifikat BNSP'
      toast.error(`❌ ${errorMsg}`)
    } finally {
      setUploadingBnsp(false)
    }
  }

  const getBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'terbit':
      case 'lengkap':
      case 'completed':
        return 'bg-green-50 text-green-600'
      case 'pending':
      case 'belum':
        return 'bg-yellow-50 text-yellow-600'
      case 'rejected':
      case 'revisi':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-dark">Detail Peserta</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={`https://ui-avatars.com/api/?name=${data.nama || 'User'}&background=random`}
                    alt={data.nama}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark">{data.nama}</h3>
                  <p className="text-gray-500">{data.email}</p>
                  {data.profile?.noWa && (
                    <p className="text-gray-500 text-sm">{data.profile.noWa}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-medium ${data.profile?.dataBnspStatus === 'Lengkap' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}
                >
                  Data BNSP: {data.profile?.dataBnspStatus || 'Belum Lengkap'}
                </span>
              </div>
            </div>

            {/* BNSP Data Section */}
            {data.profile && (
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Icon icon="solar:user-id-bold" className="text-primary" />
                  Data BNSP
                </h4>
                <div className="bg-white border rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">NIK</p>
                      <p className="font-medium">{data.profile.nik || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tempat, Tanggal Lahir</p>
                      <p className="font-medium">{data.profile.ttl || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Jenis Kelamin</p>
                      <p className="font-medium">
                        {data.profile.jk === 'L'
                          ? 'Laki-laki'
                          : data.profile.jk === 'P'
                            ? 'Perempuan'
                            : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Kota</p>
                      <p className="font-medium">{data.profile.kota || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Provinsi</p>
                      <p className="font-medium">{data.profile.provinsi || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pendidikan</p>
                      <p className="font-medium">{data.profile.pendidikan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pekerjaan</p>
                      <p className="font-medium">{data.profile.pekerjaan || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ukuran T-Shirt</p>
                      <p className="font-medium">{data.profile.tShirtSize || '-'}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-gray-500">Alamat</p>
                      <p className="font-medium">{data.profile.alamat || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-4 text-center">
                <Icon
                  icon="solar:document-text-bold"
                  className="mx-auto text-primary mb-2"
                  height={24}
                />
                <p className="text-2xl font-bold text-dark">{data.documents.total}</p>
                <p className="text-sm text-gray-500">Total Dokumen</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Icon
                  icon="solar:check-circle-bold"
                  className="mx-auto text-green-500 mb-2"
                  height={24}
                />
                <p className="text-2xl font-bold text-dark">{data.documents.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Icon
                  icon="solar:clock-circle-bold"
                  className="mx-auto text-yellow-500 mb-2"
                  height={24}
                />
                <p className="text-2xl font-bold text-dark">{data.documents.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div className="bg-white border rounded-lg p-4 text-center">
                <Icon icon="solar:refresh-bold" className="mx-auto text-red-500 mb-2" height={24} />
                <p className="text-2xl font-bold text-dark">{data.documents.revisi}</p>
                <p className="text-sm text-gray-500">Revisi</p>
              </div>
            </div>

            {/* Tasks Summary */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon icon="solar:checklist-bold" className="text-primary" />
                Penugasan
              </h4>
              <div className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Progress Tugas</span>
                  <span className="font-semibold">
                    {data.tasks.completed} / {data.tasks.total} selesai
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width:
                        data.tasks.total > 0
                          ? `${(data.tasks.completed / data.tasks.total) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* AI Generations */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon icon="solar:magic-stick-3-bold" className="text-primary" />
                AI Document Generator
              </h4>
              <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <span className="text-gray-600">Dokumen yang dibuat dengan AI</span>
                <span className="text-2xl font-bold text-primary">{data.aiGenerations}</span>
              </div>
            </div>

            {/* Documents List */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon icon="solar:folder-with-files-bold" className="text-primary" />
                Daftar Dokumen
              </h4>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          icon="solar:document-text-bold"
                          className="text-gray-400"
                          height={24}
                        />
                        <div>
                          <p className="font-medium text-dark">{doc.jenisNama || 'Dokumen'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          {doc.catatanRevisi && (
                            <p className="text-xs text-red-500 mt-1">
                              Catatan: {doc.catatanRevisi}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getBadgeClass(doc.status)}`}
                        >
                          {doc.status === 'approved'
                            ? 'Disetujui'
                            : doc.status === 'revisi'
                              ? 'Revisi'
                              : 'Pending'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          <Icon icon="solar:eye-linear" height={16} className="mr-1" />
                          Lihat
                        </Button>
                        {doc.status !== 'approved' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveDocument(doc.id)}
                              disabled={reviewingDoc === doc.id}
                            >
                              {reviewingDoc === doc.id ? (
                                <ButtonLoading />
                              ) : (
                                <Icon
                                  icon="solar:check-circle-linear"
                                  height={16}
                                  className="mr-1"
                                />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRevisiDocument(doc.id)}
                              disabled={reviewingDoc === doc.id}
                            >
                              <Icon icon="solar:pen-linear" height={16} className="mr-1" />
                              Revisi
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                  <Icon
                    icon="solar:folder-open-linear"
                    height={32}
                    className="mx-auto mb-2 text-gray-400"
                  />
                  <p>Belum ada dokumen yang diunggah</p>
                </div>
              )}
            </div>

            {/* Certificate Status */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon icon="solar:diploma-verified-bold" className="text-primary" />
                Status Sertifikat
              </h4>
              <div className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Sertifikat Training</p>
                    <p className="text-sm text-gray-500">
                      {data.hasCertificate ? 'Sertifikat sudah terbit' : 'Belum terbit'}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-medium ${data.hasCertificate ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {data.hasCertificate ? 'Terbit' : 'Belum Terbit'}
                  </span>
                </div>
              </div>
            </div>

            {/* BNSP Certificate Status */}
            <div>
              <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon icon="solar:shield-check-bold" className="text-primary" />
                Sertifikat BNSP
              </h4>

              {uploadSuccess && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-pulse">
                  <Icon icon="solar:check-circle-bold" className="text-green-600" height={20} />
                  <span className="text-sm font-medium text-green-700">
                    Sertifikat berhasil diunggah dan tersimpan!
                  </span>
                </div>
              )}

              <div className="bg-white border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Sertifikat BNSP</p>
                    <p className="text-sm text-gray-500">
                      {bnspCertificate ? 'Sertifikat sudah terbit' : 'Belum terbit'}
                    </p>
                    {bnspCertificate?.nomorSertifikat && (
                      <p className="text-xs text-gray-400 mt-1">
                        No: {bnspCertificate.nomorSertifikat}
                      </p>
                    )}
                    {bnspCertificate?.lsp && (
                      <p className="text-xs text-gray-400">LSP: {bnspCertificate.lsp}</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-medium ${bnspCertificate ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {bnspCertificate ? 'Terbit' : 'Belum Terbit'}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  {bnspCertificate?.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(bnspCertificate.fileUrl, '_blank')}
                    >
                      <Icon icon="solar:eye-linear" height={16} className="mr-1" />
                      Lihat Sertifikat
                    </Button>
                  )}
                  <label
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg transition-colors ${uploadingBnsp ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/90'}`}
                  >
                    {uploadingBnsp ? (
                      <>
                        <ButtonLoading />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:upload-linear" height={16} />
                        {bnspCertificate ? 'Upload Ulang' : 'Upload Sertifikat BNSP'}
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleUploadBnspCertificate}
                      disabled={uploadingBnsp}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">Tidak ada data</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
