import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

// Hook pour récupérer tous les profils
export const useScanProfiles = () => {
  const queryClient = useQueryClient()

  // Récupérer tous les profils
  const {
    data: profiles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['scanProfiles'],
    queryFn: async () => {
      const data = await api.getScanProfiles()
      return data
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5,
  })

  // Créer un profil
  const createProfile = useMutation({
    mutationFn: (profile) => api.createScanProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanProfiles'] })
    },
  })

  // Mettre à jour un profil
  const updateProfile = useMutation({
    mutationFn: ({ id, profile }) => api.updateScanProfile(id, profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanProfiles'] })
    },
  })

  // Supprimer un profil
  const deleteProfile = useMutation({
    mutationFn: (id) => api.deleteScanProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scanProfiles'] })
    },
  })

  return {
    profiles,
    isLoading,
    error,
    createProfile: createProfile.mutate,
    updateProfile: updateProfile.mutate,
    deleteProfile: deleteProfile.mutate,
  }
}

// Hook pour récupérer un profil spécifique avec React Query
export const useScanProfile = (profileId) => {
  return useQuery({
    queryKey: ['scanProfile', profileId],
    queryFn: () => api.getScanProfile(profileId),
    enabled: !!profileId && profileId !== '',
    staleTime: 1000 * 60 * 5,
  })
}
