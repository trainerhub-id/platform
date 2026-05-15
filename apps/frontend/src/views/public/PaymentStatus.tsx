import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, CheckCircle2, Clock3, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface PaymentStatusResponse {
  sessionId: string;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  amount: number;
  paymentMethod: string | null;
  subPaymentMethod: string | null;
  providerOrderCode: string | null;
  expiresAt: string | null;
  paidAt: string | null;
}

export default function PaymentStatus() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const claimToken = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<PaymentStatusResponse | null>(null);

  const statusMeta = useMemo(() => {
    switch (statusData?.status) {
      case 'paid':
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title: 'Pembayaran Berhasil',
          description: 'Akun Anda sedang disiapkan. Lanjut untuk login otomatis.',
        };
      case 'expired':
        return {
          icon: <XCircle className="h-12 w-12 text-amber-600" />,
          title: 'Pembayaran Kedaluwarsa',
          description: 'Sesi pembayaran sudah lewat masa berlaku. Buat pembayaran baru dari halaman pendaftaran.',
        };
      case 'failed':
        return {
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          title: 'Pembayaran Gagal',
          description: 'Provider menandai pembayaran ini gagal. Ulangi dari halaman checkout.',
        };
      default:
        return {
          icon: <Clock3 className="h-12 w-12 text-sky-600" />,
          title: 'Menunggu Pembayaran',
          description: 'TrainerHub masih menunggu konfirmasi pembayaran dari Scalev.',
        };
    }
  }, [statusData?.status]);

  const checkStatus = async (showLoader = false) => {
    if (!sessionId || !claimToken) {
      setError('Session pembayaran tidak valid');
      setLoading(false);
      return;
    }

    if (showLoader) {
      setChecking(true);
    }

    try {
      const res = await fetch(`${API_URL}/public/payment/session/${sessionId}/check?token=${encodeURIComponent(claimToken)}`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memeriksa status pembayaran');
      }

      setStatusData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [sessionId, claimToken]);

  useEffect(() => {
    if (statusData?.status !== 'pending') {
      return;
    }

    const interval = window.setInterval(() => {
      checkStatus();
    }, 7000);

    return () => window.clearInterval(interval);
  }, [statusData?.status, sessionId, claimToken]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">{statusMeta.icon}</div>
          <CardTitle>{statusMeta.title}</CardTitle>
          <CardDescription>{statusMeta.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {statusData && (
            <div className="grid gap-3 rounded-xl border bg-white p-4 text-sm md:grid-cols-2">
              <div>
                <span className="font-medium">Order:</span> {statusData.providerOrderCode || '-'}
              </div>
              <div>
                <span className="font-medium">Nominal:</span> {formatCurrency(statusData.amount)}
              </div>
              <div>
                <span className="font-medium">Metode:</span> {statusData.paymentMethod?.toUpperCase() || '-'}
              </div>
              <div>
                <span className="font-medium">Sub metode:</span> {statusData.subPaymentMethod || '-'}
              </div>
              <div>
                <span className="font-medium">Expired:</span> {statusData.expiresAt ? new Date(statusData.expiresAt).toLocaleString('id-ID') : '-'}
              </div>
              <div>
                <span className="font-medium">Paid at:</span> {statusData.paidAt ? new Date(statusData.paidAt).toLocaleString('id-ID') : '-'}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {statusData?.status === 'paid' ? (
              <Button
                className="sm:flex-1"
                onClick={() => navigate(`/payment/callback?session=${encodeURIComponent(sessionId || '')}&token=${encodeURIComponent(claimToken || '')}`)}
              >
                Lanjut Login
              </Button>
            ) : (
              <Button className="sm:flex-1" onClick={() => checkStatus(true)} disabled={checking}>
                {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Cek Lagi
              </Button>
            )}

            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={() => navigate(`/payment/checkout?session=${encodeURIComponent(sessionId || '')}&token=${encodeURIComponent(claimToken || '')}`)}
            >
              Kembali ke Checkout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
