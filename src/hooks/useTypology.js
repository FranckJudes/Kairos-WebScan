import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { typologyApi } from '../services/typologyApi'
import { useMemo } from 'react'
import toast from 'react-hot-toast'

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
    staleTime: Infinity, 
    retry: 1,
    enabled: false,
  })
}

export const useCreateTypology = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: typologyApi.createNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typology', 'tree'] })
      toast.success('Typologie créée avec succès')
    },
    onError: (error) => {
      toast.error(`Erreur lors de la création: ${error.message}`)
    },
  })
}
