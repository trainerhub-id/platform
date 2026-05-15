import { useUser } from 'src/lib/better-auth';
import { useMemo } from 'react';

export type UserRole = 'admin' | 'peserta' | 'trainer';

export const useUserRole = (): { role: UserRole; isLoading: boolean } => {
    const { user, isLoaded } = useUser();

    const role = useMemo(() => {
        if (!user) return 'peserta';
        
        // Check publicMetadata for role
        const metadataRole = user.publicMetadata?.role as string | undefined;
        if (metadataRole === 'admin') return 'admin';
        if (metadataRole === 'trainer') return 'trainer';
        
        // Check if email is admin email
        const adminEmails = [
            'admin@trainerhub.com', 
            'trisnalesmana@gmail.com',
            'admin@trilesmana.com'
        ];
        
        if (user.primaryEmailAddress?.emailAddress && 
            adminEmails.includes(user.primaryEmailAddress.emailAddress)) {
            return 'admin';
        }
        
        return 'peserta';
    }, [user]);

    return { role, isLoading: !isLoaded };
};
