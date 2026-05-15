import { useAuth, useUser } from 'src/lib/better-auth';
import { Navigate, useLocation } from 'react-router';
import { Loading } from 'src/components/ui/loading';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireRole?: 'admin' | 'peserta';
}

/**
 * Protected route wrapper that requires authentication
 * Optionally checks for specific role in user metadata
 */
export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const location = useLocation();

    // Show loading spinner while auth session is initializing
    if (!isLoaded) {
        return <Loading fullPage />;
    }

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) {
        return <Navigate to="/auth/login" replace />;
    }

    // Check role if requireRole is specified
    if (requireRole && user) {
        const userRole = (user.publicMetadata?.role as 'admin' | 'peserta') || 'peserta';
        
        // Admin trying to access peserta-only routes
        if (requireRole === 'peserta' && userRole === 'admin') {
            return <Navigate to="/admin/home" replace />;
        }
        
        // Non-admin trying to access admin routes
        if (requireRole === 'admin' && userRole !== 'admin') {
            return <Navigate to="/user/home" replace />;
        }
    }

    return <>{children}</>;
};
