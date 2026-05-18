import { Link, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Textarea } from 'src/components/ui/textarea'
import { useAuth } from 'src/lib/better-auth'

const API_URL = import.meta.env.VITE_API_URL || '/api'

interface Tier {
  id: string
  name: string
  price: number
  description: string | null
  benefits: string[] | null
  maxParticipants: number | null
  orderIndex: number
}

interface TierManagementProps {
  batchId: string
}

export default function TierManagement({ batchId }: TierManagementProps) {
  const { getToken } = useAuth()
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [benefits, setBenefits] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')

  useEffect(() => {
    fetchTiers()
  }, [batchId])

  const fetchTiers = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/batches/${batchId}/tiers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setTiers(data)
    } catch (err) {
      console.error('Error fetching tiers:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setPrice('')
    setDescription('')
    setBenefits('')
    setMaxParticipants('')
    setEditingTier(null)
  }

  const openEditDialog = (tier: Tier) => {
    setEditingTier(tier)
    setName(tier.name)
    setPrice(tier.price.toString())
    setDescription(tier.description || '')
    setBenefits(tier.benefits?.join('\n') || '')
    setMaxParticipants(tier.maxParticipants?.toString() || '')
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = await getToken()

    const payload = {
      name,
      price: parseInt(price),
      description: description || undefined,
      benefits: benefits ? benefits.split('\n').filter(Boolean) : undefined,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
    }

    try {
      let res: Response
      if (editingTier) {
        res = await fetch(`${API_URL}/admin/tiers/${editingTier.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`${API_URL}/admin/batches/${batchId}/tiers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        throw new Error('Failed to save')
      }

      toast.success(editingTier ? 'Tier berhasil diupdate' : 'Tier berhasil ditambahkan')
      setDialogOpen(false)
      resetForm()
      fetchTiers()
    } catch (err) {
      console.error('Error saving tier:', err)
      toast.error('Gagal menyimpan tier')
    }
  }

  const handleDelete = async (tierId: string) => {
    if (!confirm('Yakin ingin menghapus tier ini?')) return

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/admin/tiers/${tierId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      toast.success('Tier berhasil dihapus')
      fetchTiers()
    } catch (err) {
      console.error('Error deleting tier:', err)
      toast.error('Gagal menghapus tier')
    }
  }

  const copyRegistrationLink = (tierId: string) => {
    const link = `${window.location.origin}/register/${batchId}/${tierId}`
    navigator.clipboard.writeText(link)
    toast.success('Link pendaftaran berhasil disalin')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tier / Paket Harga</CardTitle>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open: boolean) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTier ? 'Edit Tier' : 'Tambah Tier Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tier</Label>
                <Input
                  id="name"
                  placeholder="e.g., Regular, VIP, Premium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="3000000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (opsional)</Label>
                <Input
                  id="description"
                  placeholder="Deskripsi singkat tier"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (satu per baris)</Label>
                <Textarea
                  id="benefits"
                  placeholder={'Training 2 hari\nCourse online\nSertifikat'}
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Maks Peserta (opsional)</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="Kosongkan jika unlimited"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">{editingTier ? 'Update' : 'Simpan'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : tiers.length === 0 ? (
          <p className="text-muted-foreground">
            Belum ada tier. Tambahkan tier untuk membuka pendaftaran.
          </p>
        ) : (
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{tier.name}</h4>
                  <p className="text-lg font-bold text-primary">{formatPrice(tier.price)}</p>
                  {tier.description && (
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyRegistrationLink(tier.id)}
                    title="Copy link pendaftaran"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(tier)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(tier.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
