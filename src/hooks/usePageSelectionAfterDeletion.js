import { useEffect } from 'react'

/**
 * Hook pour gérer automatiquement la sélection de page après suppression
 */
export function usePageSelectionAfterDeletion(allPages, selectedPageId, selectedDocumentId, selectPageById, setSelectedDocumentId, setSelectedPageNumber) {
  useEffect(() => {
    const selectedPageExists = allPages.some(p => p.id === selectedPageId)

    if (!selectedPageExists && allPages.length > 0) {
      const docPages = allPages.filter(p => p.documentId === selectedDocumentId)
      if (docPages.length > 0) {
        const newPageId = docPages[0].id
        selectPageById(newPageId)
      } else {
        // Current document has no pages, select first page of first available document
        const firstPage = allPages[0]
        selectPageById(firstPage.id)
      }
    } else if (!selectedPageExists && allPages.length === 0) {
      setSelectedDocumentId(null)
      setSelectedPageNumber(1)
    }
  }, [allPages, selectedPageId, selectedDocumentId, selectPageById, setSelectedDocumentId, setSelectedPageNumber])
}
