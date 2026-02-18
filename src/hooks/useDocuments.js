import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

// Custom hook to fetch documents
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: api.getDocuments,
  })
}

// Custom hook to fetch a single document
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
