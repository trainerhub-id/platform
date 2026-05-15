import { useState, useEffect } from 'react';
import api from 'src/api/axios';

export interface DashboardStats {
    totalPeserta: number;
    totalBatches: number;
    documents: {
        pending: number;
        verified: number;
        rejected: number;
    };
    tasks: {
        pending: number;
        graded: number;
    };
    completionRate: number;
}

export const useAdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/dashboard');
                // Ensure default values if some fields are missing
                const data = res.data;
                const safeStats: DashboardStats = {
                    totalPeserta: data.totalPeserta || 0,
                    totalBatches: data.totalBatches || 0,
                    documents: {
                        pending: data.documents?.pending || 0,
                        verified: data.documents?.verified || 0,
                        rejected: data.documents?.rejected || 0
                    },
                    tasks: {
                        pending: data.tasks?.pending || 0,
                        graded: data.tasks?.graded || 0
                    },
                    completionRate: data.completionRate || 0
                };
                setStats(safeStats);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching admin dashboard:', err);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading };
};
