import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDocuments } from '../contexts/DocumentsContext'
import useWebSocket from './useWebSocket'

export const useOrganizePages = () => {
  const { orderedPages, setOrderedPages, allPages } = useDocuments()
  const queryClient = useQueryClient()
  const { isConnected, eventEmitter } = useWebSocket()

  useEffect(() => {
    if (!eventEmitter) return

    const handlePagesClassified = (data) => {
      if (data.pages) {
        setOrderedPages(prev => prev.filter(p => !data.pages.includes(p.id)))
      }
    }

    const handlePagesReinserted = (data) => {
    }

    const handleTypologyUpdated = (data) => {
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
  }, [eventEmitter, queryClient, setOrderedPages])

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

  const updatePageUrl = (pageId, newUrl) => {
    setOrderedPages(prev => {
      const updated = prev.map(page =>
        page.id === pageId ? { ...page, url: newUrl } : page
      )
      queryClient.setQueryData(['organize', 'orderedPages'], updated)
      return updated
    })
  }

  return {
    allPages,
    orderedPages,
    isLoading: false,
    isWebSocketConnected: isConnected,

    resetOrder,
    removePage,
    removePages,
    reorderPages,
    addPages,
    rotatePage,
    updatePageUrl,
  }
}
