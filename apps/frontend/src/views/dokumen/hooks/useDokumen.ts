import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from 'src/api/axios';

export interface DocumentType {
  id: string;
  nama: string;
  deskripsi?: string;
  isRequired: boolean;
}

export interface DocumentCategory {
  id: string;
  nama: string;
  types: DocumentType[];
}

export interface DocumentStatus {
  id: string;
  dokumenId: string;
  jenisDokumenId: string;
  status: 'pending' | 'verified' | 'rejected' | 'missing';
  fileUrl?: string;
  catatan?: string;
  updatedAt: string;
}

const CATEGORIES_QUERY_KEY = ['dokumen', 'categories'];
const STATUSES_QUERY_KEY = ['dokumen', 'statuses'];

const fetchCategoriesWithTypes = async (): Promise<DocumentCategory[]> => {
  const catRes = await api.get('/dokumen/kategori');
  const categories = Array.isArray(catRes.data) ? catRes.data : [];

  const categoriesWithTypes = await Promise.all(
    categories.map(async (category: any) => {
      try {
        const typesRes = await api.get(`/dokumen/jenis/${category.id}`);
        const mappedTypes: DocumentType[] = (typesRes.data || []).map((type: any) => ({
          id: type.id,
          nama: type.namaJenis || type.nama,
          deskripsi: type.deskripsi,
          isRequired: type.opsional === false || type.opsional === undefined,
        }));

        return { ...category, types: mappedTypes };
      } catch (error) {
        console.error(`Failed to fetch types for category ${category.id}`, error);
        return { ...category, types: [] };
      }
    }),
  );

  return categoriesWithTypes;
};

const fetchDocumentStatuses = async (): Promise<Record<string, DocumentStatus>> => {
  const response = await api.get('/dokumen/status');
  const data = Array.isArray(response.data) ? response.data : [];

  return data.reduce((statusMap: Record<string, DocumentStatus>, item: any) => {
    statusMap[item.jenisId] = {
      id: item.id,
      dokumenId: item.id,
      jenisDokumenId: item.jenisId,
      status:
        item.status === 'approved'
          ? 'verified'
          : item.status === 'revisi'
            ? 'rejected'
            : item.status || 'pending',
      fileUrl: item.fileUrl,
      catatan: item.catatanRevisi,
      updatedAt: item.updatedAt,
    };
    return statusMap;
  }, {});
};

export const useDokumen = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategoriesWithTypes,
    staleTime: 5 * 60 * 1000,
  });

  const statusesQuery = useQuery({
    queryKey: STATUSES_QUERY_KEY,
    queryFn: fetchDocumentStatuses,
    staleTime: 60 * 1000,
  });

  const fetchCategories = useCallback(async () => {
    await categoriesQuery.refetch();
  }, [categoriesQuery]);

  const fetchStatuses = useCallback(async () => {
    await statusesQuery.refetch();
  }, [statusesQuery]);

  const uploadDocument = async (file: File, jenisDokumenId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jenisId', jenisDokumenId);

    try {
      const response = await api.post('/dokumen/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await queryClient.invalidateQueries({ queryKey: STATUSES_QUERY_KEY });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Upload failed');
    }
  };

  const deleteDocument = async (dokumenId: string) => {
    try {
      await api.delete(`/dokumen/${dokumenId}`);
      await queryClient.invalidateQueries({ queryKey: STATUSES_QUERY_KEY });
      return true;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Delete failed');
    }
  };

  return {
    categories: categoriesQuery.data || [],
    statuses: statusesQuery.data || {},
    loading: categoriesQuery.isLoading || statusesQuery.isLoading,
    error:
      (categoriesQuery.error as Error | null)?.message ||
      (statusesQuery.error as Error | null)?.message ||
      null,
    fetchCategories,
    fetchStatuses,
    uploadDocument,
    deleteDocument,
  };
};
