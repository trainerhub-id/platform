import { Navigate } from 'react-router'
import { useUser } from 'src/lib/better-auth'

export const RoleBasedRedirect = () => {
  const { user } = useUser()

  // Default to user home if no role found
  const role = user?.publicMetadata?.role || 'peserta'

  if (role === 'admin') {
    return <Navigate to="/admin/home" replace />
  }

  return <Navigate to="/user/home" replace />
}
