import { useQuery } from '@tanstack/react-query'
import apiAuth from '../services/apiAuth'

/**
 * Hook personnalisé pour récupérer le profil utilisateur via React Query
 *
 * @returns {Object} - { user, isLoading, error }
 */
const useUserProfile = () => {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => apiAuth.getProfile(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  const user = profile?.user
  const license = profile?.license
  const recentDocuments = profile?.recent_documents || []

  return {
    user,
    license,
    recentDocuments,
    isLoading,
    error,
    isAuthenticated: !!user && !error,
  }
}

export default useUserProfile
