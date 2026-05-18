import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

/**
 * Redirect component for old password reset links
 * Handles URLs sent in bulk reset emails: /sign-in?reset_password=true
 * Redirects to the new forgot password page: /auth/forgot-password
 */
export default function PasswordResetRedirect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // If has reset_password query param, redirect to forgot password page
    if (searchParams.get('reset_password') === 'true') {
      console.log('[PasswordResetRedirect] Redirecting old URL to /auth/forgot-password')
      navigate('/auth/forgot-password', { replace: true })
    } else {
      // Otherwise redirect to login
      navigate('/auth/login', { replace: true })
    }
  }, [navigate, searchParams])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CFA15A] mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
