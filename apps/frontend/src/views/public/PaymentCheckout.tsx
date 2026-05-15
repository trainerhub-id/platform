import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, Copy, ExternalLink, Loader2, QrCode, RefreshCw, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface CheckoutSession {
  sessionId: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  paymentMethod: string | null;
  subPaymentMethod: string | null;
  checkoutUrl: string | null;
  qrString: string | null;
  vaNumber: string | null;
  expiresAt: string | null;
  providerOrderCode: string | null;
}

export default function PaymentCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const claimToken = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const qrImageUrl = useMemo(() => {
    if (!session?.qrString) {
      return null;
    }

    return `https://quickchart.io/qr?text=${encodeURIComponent(session.qrString)}&size=320`;
  }, [session?.qrString]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

  const loadSession = async () => {
    if (!sessionId || !claimToken) {
      setError('Session pembayaran tidak valid');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/public/payment/session/${sessionId}?token=${encodeURIComponent(claimToken)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memuat checkout pembayaran');
      }

      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId, claimToken]);

  const handleRefresh = async () => {
    if (!sessionId || !claimToken) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/public/payment/session/${sessionId}/check?token=${encodeURIComponent(claimToken)}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memeriksa status pembayaran');
      }

      setSession(data);

      if (data.status === 'paid') {
        navigate(`/payment/status?session=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(claimToken)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setRefreshing(false);
    }
  };

  const copyValue = async (value: string | null | undefined) => {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Checkout pembayaran tidak ditemukan'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Checkout Scalev
            </CardTitle>
            <CardDescription>
              Selesaikan pembayaran Anda. Status akan divalidasi dari backend TrainerHub.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <span className="font-medium">Order:</span> {session.providerOrderCode || '-'}
            </div>
            <div>
              <span className="font-medium">Nominal:</span> {formatCurrency(session.amount)}
            </div>
            <div>
              <span className="font-medium">Metode:</span> {session.paymentMethod?.toUpperCase() || '-'}
            </div>
            <div>
              <span className="font-medium">Sub metode:</span> {session.subPaymentMethod || '-'}
            </div>
            <div>
              <span className="font-medium">Status:</span> {session.status}
            </div>
            <div>
              <span className="font-medium">Expired:</span> {session.expiresAt ? new Date(session.expiresAt).toLocaleString('id-ID') : '-'}
            </div>
          </CardContent>
        </Card>

        {session.qrString && qrImageUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QRIS
              </CardTitle>
              <CardDescription>
                Scan QR berikut dari aplikasi pembayaran Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <img src={qrImageUrl} alt="QRIS payment" className="w-full max-w-xs rounded-xl border bg-white p-4" />
              <Button variant="outline" onClick={() => copyValue(session.qrString)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy QR String
              </Button>
            </CardContent>
          </Card>
        )}

        {session.vaNumber && (
          <Card>
            <CardHeader>
              <CardTitle>Virtual Account</CardTitle>
              <CardDescription>
                Gunakan nomor VA berikut untuk transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-muted-foreground">{session.subPaymentMethod || 'VA'}</div>
                <div className="mt-1 text-2xl font-semibold tracking-wide">{session.vaNumber}</div>
              </div>
              <Button variant="outline" onClick={() => copyValue(session.vaNumber)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Nomor VA
              </Button>
            </CardContent>
          </Card>
        )}

        {session.checkoutUrl && !session.qrString && !session.vaNumber && (
          <Card>
            <CardHeader>
              <CardTitle>Lanjut ke Provider</CardTitle>
              <CardDescription>
                Metode ini memakai halaman checkout provider. Setelah selesai, kembali ke status pembayaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <a href={session.checkoutUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buka Checkout
                </a>
              </Button>
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => navigate(`/payment/status?session=${encodeURIComponent(session.sessionId)}&token=${encodeURIComponent(claimToken || '')}`)}
              >
                Saya Sudah Bayar
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleRefresh} disabled={refreshing} className="sm:flex-1">
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Cek Status Sekarang
          </Button>
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => navigate(`/payment/status?session=${encodeURIComponent(session.sessionId)}&token=${encodeURIComponent(claimToken || '')}`)}
          >
            Buka Halaman Status
          </Button>
        </div>
      </div>
    </div>
  );
}
