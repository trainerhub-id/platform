import { ProtectedRoute } from './ProtectedRoute'

interface UserRouteProps {
  children: React.ReactNode
}

/**
 * Wrapper for user-only routes
 * Requires authentication and peserta role (blocks admin)
 */
export const UserRoute = ({ children }: UserRouteProps) => {
  return <ProtectedRoute requireRole="peserta">{children}</ProtectedRoute>
}
