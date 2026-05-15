import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useUser } from 'src/lib/better-auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const claimToken = searchParams.get('token');
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    if (!userLoaded) return;

    // 2. If user is already signed in, redirect and skip everything
    if (isSignedIn) {
      console.log('[PaymentCallback] User already signed in, redirecting...');
      navigate('/user/home');
      return;
    }

    async function autoLogin() {
      if (!sessionId) {
        console.error('[PaymentCallback] No session ID in URL');
        setErrorMessage('Session ID tidak ditemukan');
        setStatus('error');
        return;
      }

      if (!claimToken) {
        console.error('[PaymentCallback] No claim token in URL');
        setErrorMessage('Token keamanan tidak ditemukan');
        setStatus('error');
        return;
      }

      // 3. Mark as processed immediately to prevent double-calls
      if (processedRef.current) {
        console.log('[PaymentCallback] Already processed, skipping');
        return;
      }

      // If user is already signed in, skip the claim process entirely
      if (isSignedIn) {
        console.log('[PaymentCallback] User already signed in, redirecting to home...');
        navigate('/user/home');
        return;
      }

      processedRef.current = true;

      try {
        console.log('[PaymentCallback] Claiming payment session:', sessionId);

        const res = await fetch(`${API_URL}/public/payment/claim/${sessionId}?token=${claimToken}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
          processedRef.current = false; // Allow retry on error if needed
          throw new Error(errorData.message || 'Failed to claim payment');
        }

        const data = await res.json();
        console.log('[PaymentCallback] Claim response:', data);

        const { email, paymentStatus } = data;
        console.log('[PaymentCallback] Payment claimed. Status:', paymentStatus);

        navigate(`/auth/login${email ? `?email=${encodeURIComponent(email)}` : ''}`);

      } catch (error) {
        console.error('[PaymentCallback] Auto-login failed:', error);

        // If already signed in error (race condition), just redirect
        if (error instanceof Error && error.message.includes('already signed in')) {
          console.log('[PaymentCallback] Already signed in during process, redirecting...');
          navigate('/user/home');
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan');
        setStatus('error');
      }
    }

    autoLogin();
  }, [sessionId, claimToken, userLoaded, navigate, isSignedIn]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={() => navigate('/auth/login')} variant="outline">
                Login Manual
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
        <p className="text-sm text-muted-foreground">
          Mohon tunggu, kami sedang memverifikasi pembayaran Anda
        </p>
      </div>
    </div>
  );
}
