import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import { ButtonLoading } from 'src/components/ui/loading'
import api from '../../../api/axios'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { Textarea } from '../../../components/ui/textarea'

interface AddPesertaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const AddPesertaModal = ({ open, onOpenChange, onSuccess }: AddPesertaModalProps) => {
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    noWa: '',
    nik: '',
    ttl: '',
    jk: '' as 'L' | 'P' | '',
    alamat: '',
    kota: '',
    provinsi: '',
    pendidikan: '',
    pekerjaan: '',
    tShirtSize: '' as 'S' | 'M' | 'L' | 'XL' | 'XXL' | '',
    paymentStatus: 'pending' as 'paid' | 'unpaid' | 'pending' | 'cancel',
    batchId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      fetchBatches()
    }
  }, [open])

  const fetchBatches = async () => {
    try {
      const response = await api.get('/batch/list')
      setBatches(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi'
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // Remove empty fields but keep batchId if selected
      const cleanData = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== ''))
      await api.post('/admin/peserta', cleanData)
      onSuccess()
      onOpenChange(false)
      // Reset form
      setFormData({
        nama: '',
        email: '',
        noWa: '',
        nik: '',
        ttl: '',
        jk: '',
        alamat: '',
        kota: '',
        provinsi: '',
        pendidikan: '',
        pekerjaan: '',
        tShirtSize: '',
        paymentStatus: 'pending',
        batchId: '',
      })
    } catch (error: any) {
      console.error('Error creating peserta:', error)
      alert(error.response?.data?.message || 'Gagal menambah peserta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:user-plus-bold" className="text-primary" height={24} />
            Tambah Peserta Manual
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nama">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                variant={errors.nama ? 'failure' : 'default'}
                placeholder="John Doe"
              />
              {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                variant={errors.email ? 'failure' : 'default'}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="noWa">No. WhatsApp</Label>
              <Input
                id="noWa"
                type="tel"
                name="noWa"
                value={formData.noWa}
                onChange={handleChange}
                placeholder="081234567890"
              />
            </div>

            <div>
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                type="text"
                name="nik"
                value={formData.nik}
                onChange={handleChange}
                maxLength={16}
                placeholder="3201234567890123"
              />
            </div>

            <div>
              <Label htmlFor="ttl">Tempat, Tanggal Lahir</Label>
              <Input
                id="ttl"
                type="text"
                name="ttl"
                value={formData.ttl}
                onChange={handleChange}
                placeholder="Jakarta, 15 Januari 1990"
              />
            </div>

            <div>
              <Label htmlFor="jk">Jenis Kelamin</Label>
              <Select value={formData.jk} onValueChange={(val) => handleSelectChange('jk', val)}>
                <SelectTrigger id="jk">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea
                id="alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                rows={2}
                placeholder="Jl. Sudirman No. 123"
              />
            </div>

            <div>
              <Label htmlFor="kota">Kota</Label>
              <Input
                id="kota"
                type="text"
                name="kota"
                value={formData.kota}
                onChange={handleChange}
                placeholder="Jakarta"
              />
            </div>

            <div>
              <Label htmlFor="provinsi">Provinsi</Label>
              <Input
                id="provinsi"
                type="text"
                name="provinsi"
                value={formData.provinsi}
                onChange={handleChange}
                placeholder="DKI Jakarta"
              />
            </div>

            <div>
              <Label htmlFor="pendidikan">Pendidikan</Label>
              <Input
                id="pendidikan"
                type="text"
                name="pendidikan"
                value={formData.pendidikan}
                onChange={handleChange}
                placeholder="S1"
              />
            </div>

            <div>
              <Label htmlFor="pekerjaan">Pekerjaan</Label>
              <Input
                id="pekerjaan"
                type="text"
                name="pekerjaan"
                value={formData.pekerjaan}
                onChange={handleChange}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <Label htmlFor="tShirtSize">Ukuran Kaos</Label>
              <Select
                value={formData.tShirtSize}
                onValueChange={(val) => handleSelectChange('tShirtSize', val)}
              >
                <SelectTrigger id="tShirtSize">
                  <SelectValue placeholder="Pilih..." />
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

            <div>
              <Label htmlFor="paymentStatus">Status Pembayaran</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(val) => handleSelectChange('paymentStatus', val)}
              >
                <SelectTrigger id="paymentStatus">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="unpaid">Belum Lunas</SelectItem>
                  <SelectItem value="cancel">Batal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="batchId">Pilih Batch (Training)</Label>
              <Select
                value={formData.batchId}
                onValueChange={(val) => handleSelectChange('batchId', val)}
              >
                <SelectTrigger id="batchId">
                  <SelectValue placeholder="Pilih Batch untuk peserta ini..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada batch</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.namaBatch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Jika dipilih, peserta akan otomatis didaftarkan ke batch tersebut.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ButtonLoading />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-circle-bold" className="mr-2" height={18} />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
