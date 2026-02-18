import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Récupère le token d'authentification depuis le stockage
 */
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/**
 * API pour gérer les documents avec upload et persistance
 */
export const documentsApi = {
  /**
   * Upload un document vers le backend
   */
  async uploadDocument(file) {
    const formData = new FormData()
    formData.append('file', file)

    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      credentials: 'include', 
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Erreur lors de l\'upload')
    }

    return response.json()
  },

  /**
   * Upload plusieurs documents
   */
  async uploadDocumentsBatch(files) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload/batch`, {
      method: 'POST',
      credentials: 'include', // Important: Envoie les cookies HttpOnly
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Erreur lors de l\'upload batch')
    }

    return response.json()
  },

  /**
   * Récupère la liste des documents
   */
  async listDocuments(skip = 0, limit = 20) {
    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `${API_BASE_URL}/documents/?skip=${skip}&limit=${limit}`,
      {
        credentials: 'include',
        headers
      }
    )

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des documents')
    }

    return response.json()
  },

  /**
   * Récupère un document par ID
   */
  async getDocument(documentId) {
    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      credentials: 'include',
      headers
    })

    if (!response.ok) {
      throw new Error('Document non trouvé')
    }

    return response.json()
  },

  /**
   * Récupère les pages d'un document avec pagination
   */
  async getDocumentPages(documentId, page = 1, limit = 50) {
    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}/pages?page=${page}&limit=${limit}`,
      {
        credentials: 'include',
        headers
      }
    )

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des pages')
    }

    return response.json()
  },

  /**
   * Supprime un document
   */
  async deleteDocument(documentId) {
    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers
    })

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression')
    }

    return response.json()
  },
}

/**
 * Hook React Query pour les documents
 */
export const useDocumentsList = (skip = 0, limit = 20) => {
  return useQuery({
    queryKey: ['documents', 'list', skip, limit],
    queryFn: () => documentsApi.listDocuments(skip, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook pour uploader un document
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file) => documentsApi.uploadDocument(file),
    onSuccess: () => {
      // Invalider le cache pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
    },
  })
}

/**
 * Hook pour uploader plusieurs documents
 */
export const useUploadDocumentsBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (files) => documentsApi.uploadDocumentsBatch(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
    },
  })
}

/**
 * Hook pour supprimer un document
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (documentId) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })
    },
  })
}

/**
 * Hook pour les pages d'un document avec pagination
 */
export const useDocumentPages = (documentId, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['documents', 'pages', documentId, page, limit],
    queryFn: () => documentsApi.getDocumentPages(documentId, page, limit),
    enabled: !!documentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
