import { useQuery } from '@tanstack/react-query'
import api from 'src/api/axios'
import { useUser } from 'src/lib/better-auth'

export interface AiAccessResponse {
  hasTier: boolean
  tierName: string | null
  aiFeatures: string[]
  courseIds: string[]
  benefits: string[]
}

const featureNames: Record<string, string> = {
  trainer: 'AI for Trainer',
  master: 'AI for Master',
  branding: 'AI for Branding',
}

export const useAiAccess = () => {
  const { isSignedIn, isLoaded } = useUser()

  const { data, isLoading, error } = useQuery<AiAccessResponse>({
    queryKey: ['ai-access'],
    queryFn: async () => {
      const response = await api.get<AiAccessResponse>('/peserta/me/access')
      return response.data
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  })

  const hasAccess = (featureId: string): boolean => {
    if (!data) return false
    return data.aiFeatures.includes(featureId)
  }

  const getUpgradeMessage = (featureId: string): string => {
    const featureName = featureNames[featureId] || 'fitur ini'

    if (!data?.hasTier) {
      return `Akses ${featureName} memerlukan paket berbayar. Silakan hubungi admin untuk upgrade.`
    }

    return `Paket ${data.tierName} Anda tidak termasuk akses ke ${featureName}. Silakan upgrade ke paket yang lebih tinggi.`
  }

  return {
    access: data,
    isLoading,
    error,
    hasAccess,
    getUpgradeMessage,
    hasTier: data?.hasTier ?? false,
    tierName: data?.tierName ?? null,
    aiFeatures: data?.aiFeatures ?? [],
  }
}
