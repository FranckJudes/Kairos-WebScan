import { useEffect } from 'react'

/**
 * Hook pour gérer automatiquement la sélection de page après suppression
 */
export function usePageSelectionAfterDeletion(allPages, selectedPageId, selectedDocumentId, selectPageById, setSelectedDocumentId, setSelectedPageNumber) {
  useEffect(() => {
    // Check if the currently selected page still exists
    const selectedPageExists = allPages.some(p => p.id === selectedPageId)

    if (!selectedPageExists && allPages.length > 0) {
      console.log('🔄 Selected page was deleted, selecting new page')

      // Try to select the first page of the current document
      const docPages = allPages.filter(p => p.documentId === selectedDocumentId)
      if (docPages.length > 0) {
        const newPageId = docPages[0].id
        console.log('✅ Selecting first page of current document:', newPageId)
        selectPageById(newPageId)
      } else {
        // Current document has no pages, select first page of first available document
        const firstPage = allPages[0]
        console.log('✅ Selecting first page of first available document:', firstPage.id)
        selectPageById(firstPage.id)
      }
    } else if (!selectedPageExists && allPages.length === 0) {
      console.log('📭 No pages left, clearing selection')
      setSelectedDocumentId(null)
      setSelectedPageNumber(1)
    }
  }, [allPages, selectedPageId, selectedDocumentId, selectPageById, setSelectedDocumentId, setSelectedPageNumber])
}
