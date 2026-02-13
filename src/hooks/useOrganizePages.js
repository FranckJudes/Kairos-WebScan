import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocuments } from '../contexts/DocumentsContext'
import useWebSocket from './useWebSocket'
import { classificationApi } from '../services/classificationApi'

/**
 * Hook optimisé avec Redis (cache backend) + WebSocket (temps réel)
 *
 * Cache Redis :
 * - Typologie : 1 heure
 * - Thumbnails : 24 heures
 *
 * WebSocket :
 * - Notifications temps réel
 * - Synchronisation multi-onglets
 */
export const useOrganizePages = () => {
  // On accède à la ref du contexte pour que l'état "vu" survive au démontage du composant
  const { documents, orderedPages, setOrderedPages, allPages } = useDocuments()
  const queryClient = useQueryClient()
  const { isConnected, eventEmitter } = useWebSocket()

  // Note: La logique de remplissage de orderedPages est maintenant dans DocumentsContext
  // pour survivre aux démontages de composants.

  // Écouter les événements WebSocket pour la synchronisation temps réel
  useEffect(() => {
    if (!eventEmitter) return

    const handlePagesClassified = (data) => {
      console.log('📡 WebSocket: Pages classées', data)
      // Retirer les pages classées de la grille
      if (data.pages) {
        setOrderedPages(prev => prev.filter(p => !data.pages.includes(p.id)))
      }
    }

    const handlePagesReinserted = (data) => {
      console.log('📡 WebSocket: Pages réinsérées', data)
      // Les pages seront ajoutées par le hook useClassifiedPages
    }

    const handleTypologyUpdated = (data) => {
      console.log('📡 WebSocket: Typologie mise à jour', data)
      // Invalider le cache de la typologie
      queryClient.invalidateQueries({ queryKey: ['typology', 'tree'] })
    }

    eventEmitter.on('pages_classified', handlePagesClassified)
    eventEmitter.on('pages_reinserted', handlePagesReinserted)
    eventEmitter.on('typology_updated', handleTypologyUpdated)

    return () => {
      eventEmitter.off('pages_classified', handlePagesClassified)
      eventEmitter.off('pages_reinserted', handlePagesReinserted)
      eventEmitter.off('typology_updated', handleTypologyUpdated)
    }
  }, [eventEmitter, queryClient])

  // Actions optimisées avec mise à jour du cache
  const resetOrder = () => {
    setOrderedPages(allPages)
    queryClient.setQueryData(['organize', 'orderedPages'], allPages)
  }

  const removePage = (pageId) => {
    setOrderedPages(prev => {
      const updated = prev.filter(page => page.id !== pageId)
      queryClient.setQueryData(['organize', 'orderedPages'], updated)
      return updated
    })
  }

  const removePages = (pageIds) => {
    setOrderedPages(prev => {
      const updated = prev.filter(page => !pageIds.has(page.id))
      queryClient.setQueryData(['organize', 'orderedPages'], updated)
      return updated
    })
  }

  const reorderPages = (oldIndex, newIndex) => {
    setOrderedPages(prev => {
      const newPages = [...prev]
      const [moved] = newPages.splice(oldIndex, 1)
      newPages.splice(newIndex, 0, moved)
      queryClient.setQueryData(['organize', 'orderedPages'], newPages)
      return newPages
    })
  }

  const addPages = (pagesToAdd) => {
    setOrderedPages(prev => {
      const updated = [...prev, ...pagesToAdd]
      queryClient.setQueryData(['organize', 'orderedPages'], updated)
      return updated
    })
  }

  const rotatePage = (pageId, rotation) => {
    setOrderedPages(prev => {
      const updated = prev.map(page =>
        page.id === pageId ? { ...page, rotation } : page
      )
      queryClient.setQueryData(['organize', 'orderedPages'], updated)
      return updated
    })
  }

  return {
    // État
    allPages,
    orderedPages,
    isLoading: allPages.length === 0 && orderedPages.length === 0,
    isWebSocketConnected: isConnected,

    // Actions
    resetOrder,
    removePage,
    removePages,
    reorderPages,
    addPages,
    rotatePage,
  }
}
