import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const claimToken = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Pembayaran Gagal</CardTitle>
          <CardDescription>
            Provider menandai pembayaran tidak berhasil. Anda bisa kembali ke checkout atau mulai ulang pendaftaran.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() =>
              navigate(
                `/payment/checkout?session=${encodeURIComponent(sessionId || '')}&token=${encodeURIComponent(claimToken || '')}`,
              )
            }
            className="w-full"
          >
            Kembali ke Checkout
          </Button>
          <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
            Mulai Ulang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
