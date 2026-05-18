import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { ButtonLoading, Loading } from 'src/components/ui/loading'
import api from '../../api/axios'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { useToast } from '../../hooks/use-toast'

const ProfilePage = () => {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    nama: '',
    email: '',
    noWa: '',
    tShirtSize: '',

    // BNSP Data
    nik: '',
    ttl: '',
    jk: '',
    alamat: '',
    kota: '',
    provinsi: '',
    pendidikan: '',
    pekerjaan: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/peserta/me')
      setFormData({
        nama: response.data.nama || '',
        email: response.data.email || '',
        noWa: response.data.noWa || '',
        tShirtSize: response.data.tShirtSize || '',
        nik: response.data.nik || '',
        ttl: response.data.ttl || '',
        jk: response.data.jk || '',
        alamat: response.data.alamat || '',
        kota: response.data.kota || '',
        provinsi: response.data.provinsi || '',
        pendidikan: response.data.pendidikan || '',
        pekerjaan: response.data.pekerjaan || '',
      })
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat profil',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch('/peserta/update', formData)
      toast({
        title: 'Berhasil',
        description: 'Profil berhasil diperbarui!',
        variant: 'default',
      })
      fetchProfile() // Refresh data
    } catch (error: any) {
      console.error('Error updating profile:', error)
      const errMsg = error.response?.data?.message
      toast({
        title: 'Gagal',
        description: Array.isArray(errMsg)
          ? errMsg[0]?.message
          : errMsg || 'Gagal menyimpan profil',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Calculate completion percentage
  const calculateCompletion = () => {
    const bnspFields = ['nik', 'ttl', 'jk', 'alamat', 'kota', 'provinsi', 'pendidikan', 'pekerjaan']
    const filledFields = bnspFields.filter(
      (field) => formData[field as keyof typeof formData],
    ).length
    return Math.round((filledFields / bnspFields.length) * 100)
  }

  const completionPercentage = calculateCompletion()
  const isComplete = completionPercentage === 100

  if (loading) {
    return <Loading fullPage text="Memuat profil..." />
  }

  return (
    <div className="space-y-6">
      {/* Page Header moved to global Header component */}

      {/* Completion Status Banner */}
      <Card
        className={`p-5 rounded-2xl border ${isComplete ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50'}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
            >
              <Icon
                icon={isComplete ? 'solar:verified-check-bold' : 'solar:document-add-bold'}
                height={28}
                className="text-white"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-bold text-base ${isComplete ? 'text-green-800' : 'text-amber-800'}`}
              >
                {isComplete ? 'Data BNSP Lengkap' : 'Lengkapi Data BNSP'}
              </h3>
              <p className={`text-sm mt-0.5 ${isComplete ? 'text-green-600' : 'text-amber-600'}`}>
                {isComplete
                  ? 'Semua data untuk pengajuan BNSP sudah lengkap.'
                  : 'Lengkapi semua data untuk keperluan sertifikasi.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center font-bold text-base ${isComplete ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}`}
            >
              {completionPercentage}%
            </div>
          </div>
        </div>
      </Card>

      {/* Basic Info Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <Icon icon="solar:user-circle-bold" className="text-[var(--color-gold)]" height={28} />
          <div>
            <h2 className="text-xl font-bold text-dark">Informasi Dasar</h2>
            <p className="text-sm text-bodytext">Data pendaftaran TrainerHub</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="nama">
              Nama Lengkap Sesuai KTP <span className="text-error">*</span>
            </Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
              placeholder="Nama lengkap sesuai KTP"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email">
              Email Aktif <span className="text-error">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-2 bg-gray-50"
            />
            <p className="text-xs text-bodytext mt-1">Email tidak dapat diubah</p>
          </div>

          <div>
            <Label htmlFor="noWa">
              No. WhatsApp Aktif <span className="text-error">*</span>
            </Label>
            <Input
              id="noWa"
              value={formData.noWa}
              onChange={(e) => handleChange('noWa', e.target.value)}
              placeholder="081234567890"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="tShirtSize">Ukuran T-Shirt</Label>
            <Select
              value={formData.tShirtSize}
              onValueChange={(value) => handleChange('tShirtSize', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih ukuran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">S</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="XL">XL</SelectItem>
                <SelectItem value="XXL">XXL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* BNSP Data Section */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <Icon icon="solar:diploma-verified-bold" className="text-[var(--color-gold)]" height={28} />
          <div>
            <h2 className="text-xl font-bold text-dark">Data BNSP</h2>
            <p className="text-sm text-bodytext">Keperluan pengajuan sertifikasi ke LSP</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="nik">
              NIK <span className="text-error">*</span>
            </Label>
            <Input
              id="nik"
              value={formData.nik}
              onChange={(e) => handleChange('nik', e.target.value)}
              placeholder="3201234567890123"
              maxLength={16}
              className="mt-2"
            />
            <p className="text-xs text-bodytext mt-1">16 digit NIK sesuai KTP</p>
          </div>

          <div>
            <Label htmlFor="ttl">
              Tempat, Tanggal Lahir <span className="text-error">*</span>
            </Label>
            <Input
              id="ttl"
              value={formData.ttl}
              onChange={(e) => handleChange('ttl', e.target.value)}
              placeholder="Jakarta, 15 Januari 1990"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="jk">
              Jenis Kelamin <span className="text-error">*</span>
            </Label>
            <Select value={formData.jk} onValueChange={(value) => handleChange('jk', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih jenis kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="kota">
              Nama Kota <span className="text-error">*</span>
            </Label>
            <Input
              id="kota"
              value={formData.kota}
              onChange={(e) => handleChange('kota', e.target.value)}
              placeholder="Jakarta"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="provinsi">
              Nama Provinsi <span className="text-error">*</span>
            </Label>
            <Input
              id="provinsi"
              value={formData.provinsi}
              onChange={(e) => handleChange('provinsi', e.target.value)}
              placeholder="DKI Jakarta"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="pendidikan">
              Pendidikan Terakhir <span className="text-error">*</span>
            </Label>
            <Input
              id="pendidikan"
              value={formData.pendidikan}
              onChange={(e) => handleChange('pendidikan', e.target.value)}
              placeholder="S1, S2, D3, SMA, dll"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="pekerjaan">
              Pekerjaan <span className="text-error">*</span>
            </Label>
            <Input
              id="pekerjaan"
              value={formData.pekerjaan}
              onChange={(e) => handleChange('pekerjaan', e.target.value)}
              placeholder="Pekerjaan saat ini"
              className="mt-2"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="alamat">
              Alamat Tempat Tinggal <span className="text-error">*</span>
            </Label>
            <Textarea
              id="alamat"
              value={formData.alamat}
              onChange={(e) => handleChange('alamat', e.target.value)}
              placeholder="Jl. Sudirman No. 123, Kelurahan..., Kecamatan..."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={fetchProfile} disabled={saving}>
          <Icon icon="solar:refresh-linear" className="mr-2" height={18} />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--color-gold)] hover:bg-[var(--color-gold-hover)] text-white"
        >
          {saving ? (
            <>
              <ButtonLoading />
              Menyimpan...
            </>
          ) : (
            <>
              <Icon icon="solar:diskette-bold" className="mr-2" height={18} />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default ProfilePage
