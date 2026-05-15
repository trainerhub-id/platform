import { useState, useEffect } from 'react';
import api from 'src/api/axios';

export interface TierTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  defaultCourseIds: string[];
  defaultAiFeatures: string[];
  defaultBenefits: string[];
  isActive: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface TierTemplateUsage {
  batchCount: number;
}

export const useTierTemplates = () => {
  const [templates, setTemplates] = useState<TierTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tier-templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Error fetching tier templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createTemplate = async (data: {
    name: string;
    description?: string;
    defaultCourseIds?: string[];
    defaultAiFeatures?: string[];
    defaultBenefits?: string[];
    orderIndex?: number;
  }) => {
    try {
      await api.post('/admin/tier-templates', data);
      await fetchTemplates();
    } catch (err) {
      console.error('Error creating template:', err);
      throw err;
    }
  };

  const updateTemplate = async (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      defaultCourseIds: string[];
      defaultAiFeatures: string[];
      defaultBenefits: string[];
      orderIndex: number;
    }>,
  ) => {
    try {
      await api.patch(`/admin/tier-templates/${id}`, data);
      await fetchTemplates();
    } catch (err) {
      console.error('Error updating template:', err);
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await api.delete(`/admin/tier-templates/${id}`);
      await fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const getUsageStats = async (id: string): Promise<TierTemplateUsage> => {
    try {
      const res = await api.get(`/admin/tier-templates/${id}/usage`);
      return res.data;
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      throw err;
    }
  };

  return {
    templates,
    loading,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getUsageStats,
  };
};
