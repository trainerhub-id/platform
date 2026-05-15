import { useState, useEffect, useCallback } from "react";
import api from "src/api/axios";

export const useManageKelas = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/kelas");
            setCourses(response.data);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching courses:", err);
            setError(err.response?.data?.message || "Gagal memuat daftar kelas");
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteCourse = async (id: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus kelas ini?")) return;
        try {
            await api.delete(`/kelas/${id}`);
            await fetchCourses();
        } catch (err: any) {
            console.error("Error deleting course:", err);
            alert(err.response?.data?.message || "Gagal menghapus kelas");
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return {
        courses,
        loading,
        error,
        refetch: fetchCourses,
        deleteCourse,
    };
};
