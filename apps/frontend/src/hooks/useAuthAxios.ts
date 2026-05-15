import { useAuth } from 'src/lib/better-auth';
import { useEffect } from 'react';
import api from '../api/axios';

/**
 * Hook to automatically configure axios with authentication token
 * Call this hook once at the app root level
 */
export const useAuthAxios = () => {
    const { getToken, isLoaded } = useAuth();

    useEffect(() => {
        if (!isLoaded) return;

        const requestInterceptor = api.interceptors.request.use(
            async (config) => {
                try {
                    // Use cached token by default, session token is read from Better Auth context
                    const token = await getToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.error('Error getting auth token:', error);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => {
            api.interceptors.request.eject(requestInterceptor);
        };
    }, [getToken, isLoaded]);

    return api;
};
