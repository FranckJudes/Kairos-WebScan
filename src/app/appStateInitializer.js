import { useQueryClient } from '@tanstack/react-query'

/**
 * Fonction d'initialisation complète de l'application
 * Vide tout le cache et recharge toutes les données pour un nouvel utilisateur
 */
export const initializeAppStates = async (queryClient) => {
  try {
    console.log('[AppStateInitializer] Début de la réinitialisation complète de l\'état...')

    // 1. Vider tout le cache existant pour éviter les données de l'utilisateur précédent
    queryClient.removeQueries()
    console.log('[AppStateInitializer] Cache vidé')

    // 2. Forcer le rechargement de toutes les clés de requête importantes
    const queryKeys = [
      ['documents'],
      ['documents', 'recent'],
      ['documents', 'search'],
      ['bannettes'],
      ['scan-profiles'],
      ['typology', 'tree'],
      ['typology', 'categories'],
      ['scan-settings', 'defaults'],
      ['user', 'preferences'],
      ['user', 'statistics'],
      ['user', 'profile'],
      ['auth', 'profile'],
      ['organizations'],
      ['workspaces'],
    ]

    // Précharger chaque type de donnée
    for (const queryKey of queryKeys) {
      try {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: async () => {
            // Construire l'URL en fonction de la clé de requête
            let url = '/api'
            if (queryKey[0] === 'documents') {
              url += '/documents'
              if (queryKey[1] === 'recent') url += '/recent'
              if (queryKey[1] === 'search') url += '/search'
            } else if (queryKey[0] === 'bannettes') {
              url += '/bannettes'
            } else if (queryKey[0] === 'scan-profiles') {
              url += '/scan-profiles'
            } else if (queryKey[0] === 'typology') {
              url += '/typology/tree'
            } else if (queryKey[0] === 'scan-settings') {
              url += '/scan-settings/defaults'
            } else if (queryKey[0] === 'user') {
              if (queryKey[1] === 'preferences') url += '/user/preferences'
              else if (queryKey[1] === 'statistics') url += '/user/statistics'
              else if (queryKey[1] === 'profile') url += '/auth/profile'
            }

            const response = await fetch(url)
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            return response.json()
          },
          staleTime: 5 * 60 * 1000,
        })
      } catch (error) {
        console.warn(`[AppStateInitializer] Impossible de précharger ${JSON.stringify(queryKey)}:`, error)
      }
    }

    return true
  } catch (error) {
    return false
  }
}


export const resetAppContexts = () => {
  window.dispatchEvent(new CustomEvent('reset-app-contexts', {
    detail: { timestamp: Date.now() }
  }))
}


export const useAppStateInitializer = () => {
  const queryClient = useQueryClient()

  return {
    initializeAppStates: () => initializeAppStates(queryClient),
    resetAppContexts,
  }
}