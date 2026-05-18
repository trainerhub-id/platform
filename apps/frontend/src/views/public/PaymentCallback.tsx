import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Button } from 'src/components/ui/button'
import { Card, CardContent } from 'src/components/ui/card'
import { useUser } from 'src/lib/better-auth'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function PaymentCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  const claimToken = searchParams.get('token')
  const { isLoaded: userLoaded, isSignedIn } = useUser()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const processedRef = useRef(false)

  useEffect(() => {
    if (!userLoaded) return

    // 2. If user is already signed in, redirect and skip everything
    if (isSignedIn) {
      navigate('/user/home')
      return
    }

    async function autoLogin() {
      if (!sessionId) {
        setErrorMessage('Session ID tidak ditemukan')
        setStatus('error')
        return
      }

      if (!claimToken) {
        setErrorMessage('Token keamanan tidak ditemukan')
        setStatus('error')
        return
      }

      // 3. Mark as processed immediately to prevent double-calls
      if (processedRef.current) return

      // If user is already signed in, skip the claim process entirely
      if (isSignedIn) {
        navigate('/user/home')
        return
      }

      processedRef.current = true

      try {
        const res = await fetch(`${API_URL}/public/payment/claim/${sessionId}?token=${claimToken}`)

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: 'Unknown error' }))
          processedRef.current = false // Allow retry on error if needed
          throw new Error(errorData.message || 'Failed to claim payment')
        }

        const data = await res.json()
        const { email } = data

        navigate(`/auth/login${email ? `?email=${encodeURIComponent(email)}` : ''}`)
      } catch (error) {
        // If already signed in error (race condition), just redirect
        if (error instanceof Error && error.message.includes('already signed in')) {
          navigate('/user/home')
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan')
        setStatus('error')
      }
    }

    autoLogin()
  }, [sessionId, claimToken, userLoaded, navigate, isSignedIn])

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
    )
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
  )
}
