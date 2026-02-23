import { useAuth } from '../contexts/AuthContext'

/**
 * Hook personnalisé pour récupérer le profil utilisateur
 * Utilise les données depuis AuthContext pour éviter les requêtes dupliquées
 *
 * @returns {Object} - { user, isLoading, error, license, recentDocuments, isAuthenticated }
 */
const useUserProfile = () => {
  const { user, isLoading, error, isAuthenticated } = useAuth()

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    license: null, 
    recentDocuments: [], 
  }
}

export default useUserProfile
