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

// Custom hook to upload a document
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.uploadDocument,
    onSuccess: () => {
      // Invalidate and refetch documents query
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

// Custom hook to start scanning
export function useStartScan() {
  return useMutation({
    mutationFn: api.startScan,
  })
}

// Custom hook to perform OCR
export function usePerformOcr() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ documentId, config }) => api.performOcr(documentId, config),
    onSuccess: (_, variables) => {
      // Invalidate the specific document query
      queryClient.invalidateQueries({ queryKey: ['documents', variables.documentId] })
    },
  })
}
