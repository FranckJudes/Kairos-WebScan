import { useQuery } from '@tanstack/react-query'
import { typologyApi } from '../services/typologyApi'
import { useMemo } from 'react'

export const useTypologyTree = () => {
  const query = useQuery({
    queryKey: ['typology', 'tree'],
    queryFn: async () => {
      const types = await typologyApi.getTree()
      return types
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  })

  // Convertir les données en format hiérarchique pour react-arborist
  const treeData = useMemo(() => {
    if (!query.data) return null
    return typologyApi.convertToTreeFormat(query.data)
  }, [query.data])

  return { ...query, data: treeData }
}

export const useTypologyInitialization = () => {
  return useQuery({
    queryKey: ['typology', 'init'],
    queryFn: typologyApi.initialize,
    staleTime: Infinity, // Pas besoin de recharger
    retry: 1,
    enabled: false, // Ne s'exécute pas automatiquement
  })
}
