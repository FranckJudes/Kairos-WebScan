import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Hook pour gérer les bannettes (sauvegardes d'état)
 */
export const useBannettes = () => {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [triggerRefresh, setTriggerRefresh] = useState(0)
  const { selectedBannetteId, setSelectedBannetteId } = useAuth()

  const {
    data: bannettesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bannettes', currentPage, pageSize, triggerRefresh],
    queryFn: () => api.getBannettes(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const allBannettes = bannettesData || []
  const total = bannettesData?.length || 0

  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBannettes = allBannettes.slice(startIndex, endIndex)
  const totalPages = Math.ceil(total / pageSize)

  // Fonction pour obtenir toutes les bannettes (sans pagination)
  const getAllBannettes = () => {
    const data = queryClient.getQueryData(['bannettes', 0, pageSize])
    return data || []
  }

  const createBannetteMutation = useMutation({
    mutationFn: (data) => api.createBannette(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
      setCurrentPage(0)
    },
  })

  const createDefaultBannetteMutation = useMutation({
    mutationFn: () => api.createDefaultBannette(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
      setCurrentPage(0)
    },
  })

  const updateBannetteMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateBannette(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
    },
  })

  const deleteBannetteMutation = useMutation({
    mutationFn: (id) => api.deleteBannette(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
      if (paginatedBannettes.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1)
      }
    },
  })

  // Créer une bannette
  const createBannette = async (name, pagesOrder, classifiedPages, totalPages, description = null) => {
    const result = await createBannetteMutation.mutateAsync({
      name,
      description,
      pages_order: pagesOrder,
      classified_pages: classifiedPages,
      total_pages: totalPages,
    })
    // Sélectionner la nouvelle bannette créée
    setSelectedBannetteId(result.id)
    return result
  }

  // Sélectionner une bannette
  const selectBannette = (bannetteId) => {
    setSelectedBannetteId(bannetteId)
    localStorage.setItem('selectedBannetteId', bannetteId)
  }

  // Mettre à jour une bannette
  const updateBannette = async (id, data) => {
    return updateBannetteMutation.mutateAsync({ id, data })
  }

  // Supprimer une bannette
  const deleteBannette = async (id) => {
    return deleteBannetteMutation.mutateAsync(id)
  }

  const loadBannette = async (id) => {
    const response = await api.getBannette(id)
    return response
  }

  // Pagination
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (page) => {
    setCurrentPage(page)
  }

  return {
    bannettes: paginatedBannettes,
    allBannettes,
    getAllBannettes,
    total,
    currentPage,
    totalPages,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    setCurrentPage,
    refresh: () => setTriggerRefresh(prev => prev + 1),
    isLoading,
    error,
    createBannette,
    createDefaultBannette: () => createDefaultBannetteMutation.mutateAsync(),
    updateBannette,
    deleteBannette,
    loadBannette,
    selectBannette,
    selectedBannetteId,
    isCreating: createBannetteMutation.isPending,
    isUpdating: updateBannetteMutation.isPending,
    isDeleting: deleteBannetteMutation.isPending,
    isCreatingDefault: createDefaultBannetteMutation.isPending,
  }
}
