import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
    children: React.ReactNode;
}

/**
 * Wrapper for admin-only routes
 * Requires both authentication and admin role
 */
export const AdminRoute = ({ children }: AdminRouteProps) => {
    return (
        <ProtectedRoute requireRole="admin">
            {children}
        </ProtectedRoute>
    );
};
