import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: api.getDocuments,
  })
}

export function useRecentDocuments(limit = 100) {
  return useQuery({
    queryKey: ['documents', 'recent', limit],
    queryFn: () => api.getRecentDocuments(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useDocument(id) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => api.getDocument(id),
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useStartScan() {
  return useMutation({
    mutationFn: api.startScan,
  })
}

export function usePerformOcr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ documentId, config }) => api.performOcr(documentId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId) => api.deleteDocument(documentId),
    onSuccess: () => {
      // Invalider toutes les requêtes liées aux documents
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}
