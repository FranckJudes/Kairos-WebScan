import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDocuments } from '../contexts/DocumentsContext'
import useWebSocket from './useWebSocket'

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
  const { documents } = useDocuments()
  const queryClient = useQueryClient()
  const { isConnected, eventEmitter } = useWebSocket()

  // Calculer toutes les pages (cache local avec useMemo)
  const allPages = useMemo(() => {
    const pages = []
    documents.forEach((doc) => {
      // Normaliser les noms de champs pour compatibilité backend/frontend
      const docType = doc.type || doc.file_type || 'image/png'
      const docName = doc.name || doc.original_name || 'Document'
      const docSize = doc.size || doc.file_size || 10000

      if (doc.pages && doc.pages.length > 0) {
        doc.pages.forEach((page) => {
          pages.push({
            id: `${doc.id}-page-${page.pageNumber}`,
            documentId: doc.id,
            documentName: docName,
            pageNumber: page.pageNumber,
            type: page.type || 'image/png',
            url: page.url,
            size: docSize / doc.pages.length,
            rotation: 0
          })
        })
      } else if (docType === 'application/pdf') {
        const numPages = doc.numPages || 1
        for (let i = 1; i <= numPages; i++) {
          pages.push({
            id: `${doc.id}-page-${i}`,
            documentId: doc.id,
            documentName: docName,
            pageNumber: i,
            type: docType,
            url: doc.url,
            size: docSize / numPages,
            rotation: 0
          })
        }
      } else {
        pages.push({
          id: `${doc.id}-page-1`,
          documentId: doc.id,
          documentName: docName,
          pageNumber: 1,
          type: docType,
          url: doc.url,
          size: docSize,
          rotation: 0
        })
      }
    })
    return pages
  }, [documents])

  // État local pour les pages ordonnées
  const [orderedPages, setOrderedPages] = useState([])

  // Initialiser depuis le cache TanStack Query si disponible
  const { data: cachedOrderedPages } = useQuery({
    queryKey: ['organize', 'orderedPages'],
    queryFn: () => Promise.resolve(orderedPages),
    initialData: allPages,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Ne pas refetch automatiquement
  })

  // Synchroniser une seule fois au chargement
  useEffect(() => {
    if (allPages.length > 0 && orderedPages.length === 0) {
      // Restaurer depuis le cache si disponible
      const cached = queryClient.getQueryData(['organize', 'orderedPages'])
      setOrderedPages(cached || allPages)
    }
  }, [allPages, orderedPages.length, queryClient])

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
