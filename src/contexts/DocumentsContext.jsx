import { createContext, useContext, useState, useRef, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../hooks/useDocumentsApi'
import useWebSocket from '../hooks/useWebSocket'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DocumentsContext = createContext(null)

export function useDocuments() {
  const context = useContext(DocumentsContext)
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentsProvider')
  }
  return context
}

export function DocumentsProvider({ children }) {
  const queryClient = useQueryClient()
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [selectedPageNumber, setSelectedPageNumber] = useState(1)
  const [orderedPages, setOrderedPages] = useState([])
  const [classifiedPages, setClassifiedPages] = useState({})
  const [documentVersion, setDocumentVersion] = useState(0) // Pour forcer le re-render

  const seenPageIdsRef = useRef(new Set())

  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: () => documentsApi.listDocuments(0, 100),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Ne charge PAS automatiquement - seulement via upload
  })

  const documents = (documentsData?.documents || []).map(doc => {
    // Si l'URL est relative (commence par /), on ajoute l'URL de base
    let docUrl = doc.url || `${API_BASE_URL}/uploads/${doc.filename}`
    if (docUrl.startsWith('/')) {
      docUrl = `${API_BASE_URL}${docUrl}`
    }

    return {
      ...doc,
      name: doc.original_name || doc.name,
      type: doc.file_type || doc.type,
      url: docUrl,
      createdAt: doc.created_at || doc.createdAt
    }
  })

  /**
   * Ajouter un document (upload vers le backend)
   */
  const addDocument = async (file) => {
    try {
      const result = await documentsApi.uploadDocument(file)


      if (result.success) {
        const newDoc = result.document

        const fullUrl = newDoc.url?.startsWith('/')
          ? `${API_BASE_URL}${newDoc.url}`
          : (newDoc.url || `${API_BASE_URL}/uploads/${newDoc.filename}`)

        queryClient.setQueryData(['documents', 'list'], (old) => {
          const currentDocs = old?.documents || []
          return {
            ...old,
            documents: [...currentDocs, newDoc],
            total: (old?.total || 0) + 1
          }
        })

        setSelectedDocumentId(newDoc.id)
        setSelectedPageNumber(1)

        return newDoc
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Ajouter plusieurs documents
   */
  const addDocuments = async (files) => {
    try {
      const results = []

      for (const file of files) {
        try {
          const doc = await addDocument(file)
          results.push({ success: true, document: doc })
        } catch (error) {
          results.push({ success: false, filename: file.name, error: error.message })
        }
      }

      const successCount = results.filter(r => r.success).length

      return results
    } catch (error) {
      throw error
    }
  }

  /**
   * Supprimer un document
   */
  const removeDocument = async (id) => {
    try {
      await documentsApi.deleteDocument(id)

      await refetch()

      if (selectedDocumentId === id) {
        const remainingDocs = documents.filter(doc => doc.id !== id)
        setSelectedDocumentId(remainingDocs[0]?.id || null)
        setSelectedPageNumber(1)
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Vider tous les documents (en local seulement)
   */
  const clearDocuments = () => {
    setSelectedDocumentId(null)
    setSelectedPageNumber(1)
    queryClient.setQueryData(['documents', 'list'], { documents: [], total: 0 })
  }

  /**
   * Mettre à jour le nombre de pages d'un document
   */
  const updateDocumentNumPages = (id, numPages) => {
    queryClient.setQueryData(['documents', 'list'], (old) => {
      if (!old) return old

      return {
        ...old,
        documents: old.documents.map(doc =>
          doc.id === id ? { ...doc, numPages } : doc
        )
      }
    })
  }

  /**
   * Réorganiser les pages d'un document (drag and drop)
   */
  const reorderPages = (documentId, oldIndex, newIndex) => {
    queryClient.setQueryData(['documents', 'list'], (old) => {
      if (!old) return old

      return {
        ...old,
        documents: old.documents.map(doc => {
          if (doc.id === documentId && doc.pages) {
            const pages = [...doc.pages]
            const [removed] = pages.splice(oldIndex, 1)
            pages.splice(newIndex, 0, removed)

            return {
              ...doc,
              pages: pages.map((page, index) => ({
                ...page,
                pageNumber: index + 1
              }))
            }
          }
          return doc
        })
      }
    })

    if (selectedPageNumber === oldIndex + 1) {
      setSelectedPageNumber(newIndex + 1)
    } else if (selectedPageNumber === newIndex + 1) {
      setSelectedPageNumber(oldIndex + 1)
    }
  }

  /**
   * Mettre à jour l'URL d'une page après rognage
   */
  const updatePageUrl = (documentId, pageNumber, newUrl) => {
    // Mettre à jour le document dans le cache
    queryClient.setQueryData(['documents', 'list'], (old) => {
      if (!old) return old

      const updated = {
        ...old,
        documents: old.documents.map(doc => {
          if (doc.id === documentId) {
            // Si le document a déjà des pages, mettre à jour la page spécifique
            if (doc.pages) {
              const updated = {
                ...doc,
                pages: doc.pages.map(page =>
                  page.pageNumber === pageNumber
                    ? { ...page, url: newUrl }
                    : page
                )
              }
              return updated
            }
            // Si le document n'a pas de pages mais a plusieurs pages (multipages PDF)
            // On crée une structure de pages pour ne pas affecter les autres pages
            else if (doc.numPages && doc.numPages > 1) {
              // Créer un tableau de pages avec l'URL rognée pour cette page spécifique
              const pages = Array.from({ length: doc.numPages }, (_, i) => ({
                pageNumber: i + 1,
                url: i + 1 === pageNumber ? newUrl : doc.url,
                originalPageNumber: i + 1
              }))

              const updated = {
                ...doc,
                pages: pages
              }
              return updated
            }
            // Pour un document d'une seule page, on peut mettre à jour l'URL du document
            else if (pageNumber === 1) {
              const updated = {
                ...doc,
                url: newUrl
              }
              return updated
            }
          }
          return doc
        })
      }

      return updated
    })

    // Mettre à jour aussi orderedPages pour que la sidebar se mette à jour immédiatement
    setOrderedPages(prev => {
      return prev.map(page => {
        // Trouver les pages qui appartiennent à ce document et à ce numéro de page
        const pageId = `${documentId}-${pageNumber - 1}`
        if (page.id === pageId || (page.documentId === documentId && page.pageNumber === pageNumber)) {
          return { ...page, url: newUrl }
        }
        return page
      })
    })

    // Forcer le re-render de tous les composants qui utilisent les documents
    setDocumentVersion(prev => prev + 1)
  }
  const allPages = documents.flatMap(doc => {
    // Si le document a des pages, les utiliser en normalisant les URLs
    const docPages = doc.pages
      ? doc.pages.map(page => {
          let pageUrl = page.url
          // Ensure URL is complete (add base URL if relative)
          if (pageUrl && pageUrl.startsWith('/')) {
            pageUrl = `${API_BASE_URL}${pageUrl}`
          }
          return {
            ...page,
            url: pageUrl
          }
        })
      : Array.from({ length: doc.numPages || 1 }, (_, i) => ({
          pageNumber: i + 1,
          url: doc.url,  // doc.url is already normalized
          originalPageNumber: i + 1
        }))
    return docPages.map((page, index) => ({
      ...page,
      id: `${doc.id}-${index}`,
      documentId: doc.id,
      documentName: doc.name,
      originalIndex: index
    }))
  })

  const { eventEmitter } = useWebSocket()

  useEffect(() => {
    if (!eventEmitter) return
  }, [eventEmitter])

  useEffect(() => {
    if (isLoading) return

    const newPages = allPages.filter(p => !seenPageIdsRef.current.has(p.id))

    if (newPages.length > 0) {
      newPages.forEach(p => seenPageIdsRef.current.add(p.id))

      setOrderedPages(prev => [...prev, ...newPages])

      queryClient.setQueryData(['organize', 'orderedPages'], (old) => {
        return old ? [...old, ...newPages] : [...newPages]
      })
    }
  }, [allPages, isLoading, queryClient])

  const selectPageById = (pageId) => {
    const [docId, pageIndex] = pageId.split('-').map(Number)
    const doc = documents.find(d => d.id === docId)
    if (doc) {
      setSelectedDocumentId(docId)
      setSelectedPageNumber(pageIndex + 1)
    }
  }

  const selectedPageId = selectedDocumentId
    ? `${selectedDocumentId}-${(selectedPageNumber || 1) - 1}`
    : null

  // Utiliser useMemo pour forcer le recalcul de selectedDocument quand documentVersion change
  // IMPORTANT: Lire directement depuis le cache au lieu de 'documents' pour éviter les données stalles
  const selectedDocument = useMemo(() => {
    // Lire depuis le cache mis à jour
    const cachedData = queryClient.getQueryData(['documents', 'list'])
    const cachedDocs = cachedData?.documents || []

    // Normaliser les documents comme dans la ligne 33
    const normalizedDocs = cachedDocs.map(doc => {
      let docUrl = doc.url || `${API_BASE_URL}/uploads/${doc.filename}`
      if (docUrl.startsWith('/')) {
        docUrl = `${API_BASE_URL}${docUrl}`
      }

      return {
        ...doc,
        name: doc.original_name || doc.name,
        type: doc.file_type || doc.type,
        url: docUrl,
        createdAt: doc.created_at || doc.createdAt
      }
    })

    return normalizedDocs.find(doc => doc.id === selectedDocumentId)
  }, [selectedDocumentId, documentVersion, queryClient])

  const value = {
    documents,
    allPages,
    selectedPageId,
    setDocuments: (docs) => {
      const docsToSet = typeof docs === 'function' ? docs(documentsData?.documents || []) : docs
      queryClient.setQueryData(['documents', 'list'], { documents: docsToSet, total: docsToSet.length })
    },
    selectedDocument,
    selectedDocumentId,
    selectedPageNumber,
    setSelectedDocumentId,
    setSelectedPageNumber,
    selectPageById,
    addDocument,
    addDocuments,
    removeDocument,
    clearDocuments,
    updateDocumentNumPages,
    reorderPages,
    updatePageUrl,
    orderedPages,
    setOrderedPages,
    classifiedPages,
    setClassifiedPages,
    isLoading,
    error,
    seenPageIdsRef,
    documentVersion,
  }

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}
