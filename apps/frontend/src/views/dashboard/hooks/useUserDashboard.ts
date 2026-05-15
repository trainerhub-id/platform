import { useState, useEffect } from 'react';
import { useAuth } from 'src/lib/better-auth';
import api from 'src/api/axios';

export interface DashboardData {
    profile: any;
    activeBatch: any;
    tasks: any[];
    submissions: any[];
    loading: boolean;
    error: any;
}

export const useUserDashboard = () => {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [data, setData] = useState<DashboardData>({
        profile: null,
        activeBatch: null,
        tasks: [],
        submissions: [],
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (!isSignedIn) {
            setData(prev => ({ ...prev, loading: false, error: null }));
            return;
        }

        let isCancelled = false;

        const fetchData = async () => {
            try {
                setData(prev => ({ ...prev, loading: true, error: null }));

                const token = await getToken({ skipCache: true });
                const authHeaders = token
                    ? { Authorization: `Bearer ${token}` }
                    : {};

                const [profileResult, batchesResult, tasksResult, submissionsResult] = await Promise.allSettled([
                    api.get('/peserta/me', { headers: authHeaders }),
                    api.get('/batch/list', { headers: authHeaders }),
                    api.get('/tugas/list', { headers: authHeaders }),
                    api.get('/tugas/my-submissions', { headers: authHeaders }),
                ]);

                const profileRes = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
                const batchesRes = batchesResult.status === 'fulfilled' ? batchesResult.value.data : [];
                const tasksRes = tasksResult.status === 'fulfilled' ? tasksResult.value.data : [];
                const submissionsRes = submissionsResult.status === 'fulfilled' ? submissionsResult.value.data : [];

                if (profileResult.status === 'rejected') {
                    console.error('Error fetching profile:', profileResult.reason);
                }
                if (batchesResult.status === 'rejected') {
                    console.error('Error fetching batches:', batchesResult.reason);
                }
                if (tasksResult.status === 'rejected') {
                    console.error('Error fetching tasks:', tasksResult.reason);
                }
                if (submissionsResult.status === 'rejected') {
                    console.error('Error fetching submissions:', submissionsResult.reason);
                }

                // Keep dashboard usable even when non-critical endpoints fail.
                const activeBatch = Array.isArray(batchesRes) && batchesRes.length > 0 ? batchesRes[0] : null;

                if (isCancelled) {
                    return;
                }

                setData({
                    profile: profileRes,
                    activeBatch,
                    tasks: Array.isArray(tasksRes) ? tasksRes : [],
                    submissions: Array.isArray(submissionsRes) ? submissionsRes : [],
                    loading: false,
                    error: null,
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                if (!isCancelled) {
                    setData(prev => ({ ...prev, loading: false, error: err }));
                }
            }
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, [getToken, isLoaded, isSignedIn]);

    return data;
};
