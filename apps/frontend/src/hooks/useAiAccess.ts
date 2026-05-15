import { useQuery } from '@tanstack/react-query';
import { useUser } from 'src/lib/better-auth';
import api from 'src/api/axios';

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

export interface AiAccessResponse {
  hasTier: boolean;
  tierName: string | null;
  aiFeatures: string[];
  courseIds: string[];
  benefits: string[];
}

export const useAiAccess = () => {
  const { isSignedIn, isLoaded } = useUser();

  const { data, isLoading, error } = useQuery<AiAccessResponse>({
    queryKey: ['ai-access'],
    queryFn: async () => {
      debugLog('[useAiAccess] Fetching /peserta/me/access...');
      try {
        const response = await api.get('/peserta/me/access');
        debugLog('[useAiAccess] Response:', response.data);
        return response.data;
      } catch (err: any) {
        console.error('[useAiAccess] Error:', err.response?.data || err.message);
        throw err;
      }
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  debugLog('[useAiAccess] State:', {
    isLoading,
    error: error?.message,
    data,
    hasTier: data?.hasTier,
    tierName: data?.tierName,
    aiFeatures: data?.aiFeatures,
  });

  const hasAccess = (featureId: string): boolean => {
    if (!data) {
      debugLog(`[useAiAccess] hasAccess(${featureId}): NO DATA`);
      return false;
    }
    const result = data.aiFeatures.includes(featureId);
    debugLog(`[useAiAccess] hasAccess(${featureId}):`, result, '| aiFeatures:', data.aiFeatures);
    return result;
  };

  const getUpgradeMessage = (featureId: string): string => {
    const featureNames: Record<string, string> = {
      trainer: 'AI for Trainer',
      master: 'AI for Master',
      branding: 'AI for Branding',
    };

    const featureName = featureNames[featureId] || 'fitur ini';
    
    if (!data?.hasTier) {
      return `Akses ${featureName} memerlukan paket berbayar. Silakan hubungi admin untuk upgrade.`;
    }

    return `Paket ${data.tierName} Anda tidak termasuk akses ke ${featureName}. Silakan upgrade ke paket yang lebih tinggi.`;
  };

  return {
    access: data,
    isLoading,
    error,
    hasAccess,
    getUpgradeMessage,
    hasTier: data?.hasTier ?? false,
    tierName: data?.tierName ?? null,
    aiFeatures: data?.aiFeatures ?? [],
  };
};
