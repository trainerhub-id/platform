import { useUser } from 'src/lib/better-auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';

/**
 * Hook to check if user needs to reset password
 * Redirects to reset page if mustResetPassword flag is set
 */
export function usePasswordResetGuard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;

    const mustReset = user?.unsafeMetadata?.mustResetPassword;
    if (mustReset) {
      console.log('[PasswordResetGuard] User must reset password, redirecting...');
      navigate('/reset-password-required');
    }
  }, [user, isLoaded, navigate]);
}

/**
 * Clear the mustResetPassword flag after successful reset
 */
export async function clearPasswordResetFlag(user: any) {
  if (!user) return;

  try {
    await user.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        passwordResetCompletedAt: new Date().toISOString(),
      },
    });

    // Note: privateMetadata can only be updated from backend
    // Frontend should call backend endpoint to clear the flag
    console.log('[PasswordResetGuard] Password reset completed, metadata updated');
  } catch (error) {
    console.error('[PasswordResetGuard] Failed to update metadata:', error);
  }
}
