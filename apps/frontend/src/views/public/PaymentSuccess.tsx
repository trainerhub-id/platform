import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const claimToken = searchParams.get('token');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Pembayaran Terkonfirmasi</CardTitle>
          <CardDescription>
            Lanjutkan ke status pembayaran untuk aktivasi akun TrainerHub.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() =>
              navigate(
                `/payment/status?session=${encodeURIComponent(sessionId || '')}&token=${encodeURIComponent(claimToken || '')}`,
              )
            }
          >
            Buka Status Pembayaran
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/auth/login')}>
            Login Manual
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
