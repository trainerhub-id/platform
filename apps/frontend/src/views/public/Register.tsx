import { Calendar, CheckCircle, Loader2, MapPin, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Alert, AlertDescription } from 'src/components/ui/alert'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { useUser } from 'src/lib/better-auth'

const API_URL = import.meta.env.VITE_API_URL || '/api'

interface BatchTier {
  id: string
  name: string
  price: number
  description: string | null
  benefits: string[] | null
}

interface BatchInfo {
  id: string
  namaBatch: string
  tanggal: string
  tanggalSelesai: string | null
  hotel: string | null
  alamat: string | null
  imageUrl: string | null
}

export default function Register() {
  const navigate = useNavigate()
  const { batchSlug: pathBatchSlug, tierSlug: pathTierSlug } = useParams<{
    batchSlug: string
    tierSlug: string
  }>()
  const [searchParams] = useSearchParams()
  const { user } = useUser()

  // Prioritize query params over path params
  const batchSlug = searchParams.get('batch') || pathBatchSlug
  const tierSlug = searchParams.get('tier') || pathTierSlug

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [batch, setBatch] = useState<BatchInfo | null>(null)
  const [tier, setTier] = useState<BatchTier | null>(null)

  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('qris')
  const [subPaymentMethod, setSubPaymentMethod] = useState('BNI')

  const paymentOptions = [
    { value: 'qris', label: 'QRIS' },
    { value: 'va', label: 'Virtual Account' },
    { value: 'invoice', label: 'Invoice Checkout' },
    { value: 'ovo', label: 'OVO' },
    { value: 'dana', label: 'DANA' },
    { value: 'shopeepay', label: 'ShopeePay' },
    { value: 'linkaja', label: 'LinkAja' },
    { value: 'gopay', label: 'GoPay' },
  ]

  const vaOptions = ['BNI', 'BRI', 'MANDIRI', 'PERMATA', 'BSI', 'BJB', 'CIMB', 'SAHABAT_SAMPOERNA']

  // Auto-fill email if user is logged in
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress)
    }

    // Auto-fill WhatsApp from unsafeMetadata
    if (user?.unsafeMetadata?.whatsapp) {
      setWhatsapp(user.unsafeMetadata.whatsapp as string)
    }
  }, [user])

  useEffect(() => {
    if (batchSlug && tierSlug) {
      fetchTierInfo()
    }
  }, [batchSlug, tierSlug])

  const fetchTierInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/public/batches/${batchSlug}/tiers/${tierSlug}`)
      if (!res.ok) {
        throw new Error('Batch atau tier tidak ditemukan')
      }
      const data = await res.json()
      setBatch(data.batch)
      setTier(data.tier)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const checkDuplicate = async (): Promise<boolean> => {
    const res = await fetch(`${API_URL}/public/register/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, batchSlug }),
    })
    const data = await res.json()
    if (data.isDuplicate) {
      setError(data.message)
      return true
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const isDuplicate = await checkDuplicate()
      if (isDuplicate) {
        setSubmitting(false)
        return
      }

      const res = await fetch(`${API_URL}/public/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          whatsapp,
          batchSlug,
          tierSlug,
          paymentMethod,
          subPaymentMethod: paymentMethod === 'va' ? subPaymentMethod : null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Gagal membuat pendaftaran')
      }

      const data = await res.json()
      navigate(
        `/payment/checkout?session=${encodeURIComponent(data.sessionId)}&token=${encodeURIComponent(data.claimToken)}`,
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(message)
      setSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          {batch?.imageUrl && (
            <img
              src={batch.imageUrl}
              alt={batch.namaBatch}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{batch?.namaBatch}</CardTitle>
            <CardDescription className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{batch?.tanggal && formatDate(batch.tanggal)}</span>
              </div>
              {batch?.hotel && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{batch.hotel}</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {tier?.name}
                </CardTitle>
                {tier?.description && <CardDescription>{tier.description}</CardDescription>}
              </div>
              <div className="text-2xl font-bold text-primary">
                {tier?.price && formatPrice(tier.price)}
              </div>
            </div>
          </CardHeader>
          {tier?.benefits && tier.benefits.length > 0 && (
            <CardContent>
              <p className="text-sm font-medium mb-2">Yang Anda dapatkan:</p>
              <ul className="space-y-1">
                {tier.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form Pendaftaran</CardTitle>
            <CardDescription>Lengkapi data berikut untuk melanjutkan ke pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  placeholder="08123456789"
                  value={whatsapp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '')
                    setWhatsapp(value)
                  }}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === 'va' && (
                <div className="space-y-2">
                  <Label>Bank Virtual Account</Label>
                  <Select
                    value={subPaymentMethod}
                    onValueChange={setSubPaymentMethod}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bank VA" />
                    </SelectTrigger>
                    <SelectContent>
                      {vaOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  `Bayar ${tier?.price && formatPrice(tier.price)}`
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Pembayaran Scalev akan dibuka di checkout TrainerHub. QRIS dan VA tampil langsung,
                e-wallet bisa lanjut ke halaman provider jika diperlukan.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
