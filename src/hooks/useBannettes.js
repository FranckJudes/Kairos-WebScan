import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useState } from 'react'

/**
 * Hook pour gérer les bannettes (sauvegardes d'état)
 */
export const useBannettes = () => {
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)

  // Liste des bannettes avec pagination
  const {
    data: bannettesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bannettes', currentPage, pageSize],
    queryFn: () => api.getBannettes(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Pagination des données
  const allBannettes = bannettesData?.bannettes || []
  const total = bannettesData?.total || 0

  // Calculer les bannettes pour la page courante
  const startIndex = currentPage * pageSize
  const endIndex = startIndex + pageSize
  const paginatedBannettes = allBannettes.slice(startIndex, endIndex)
  const totalPages = Math.ceil(total / pageSize)

  // Créer une bannette
  const createBannetteMutation = useMutation({
    mutationFn: (data) => api.createBannette(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
      setCurrentPage(0) // Retour à la première page après création
    },
  })

  // Mettre à jour une bannette
  const updateBannetteMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateBannette(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
    },
  })

  // Supprimer une bannette
  const deleteBannetteMutation = useMutation({
    mutationFn: (id) => api.deleteBannette(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannettes'] })
      // Ajuster la page si nécessaire
      if (paginatedBannettes.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1)
      }
    },
  })

  // Créer une bannette
  const createBannette = async (name, pagesOrder, classifiedPages, totalPages, description = null) => {
    return createBannetteMutation.mutateAsync({
      name,
      description,
      pages_order: pagesOrder,
      classified_pages: classifiedPages,
      total_pages: totalPages,
    })
  }

  // Mettre à jour une bannette
  const updateBannette = async (id, data) => {
    return updateBannetteMutation.mutateAsync({ id, data })
  }

  // Supprimer une bannette
  const deleteBannette = async (id) => {
    return deleteBannetteMutation.mutateAsync(id)
  }

  // Charger une bannette (récupérer les détails)
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
    total,
    currentPage,
    totalPages,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    setCurrentPage,
    isLoading,
    error,
    createBannette,
    updateBannette,
    deleteBannette,
    loadBannette,
    isCreating: createBannetteMutation.isPending,
    isUpdating: updateBannetteMutation.isPending,
    isDeleting: deleteBannetteMutation.isPending,
  }
}
