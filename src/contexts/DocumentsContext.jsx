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
  const [documentVersion, setDocumentVersion] = useState(0) 

  const seenPageIdsRef = useRef(new Set())

  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: () => documentsApi.listDocuments(0, 100),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Ne charge PAS automatiquement - seulement via upload
  })

  const documents = (documentsData?.documents || []).map(doc => {
    let docUrl = doc.url || `${API_BASE_URL}/uploads/${doc.filename}`
    if (docUrl.startsWith('/')) {
      docUrl = `${API_BASE_URL}${docUrl}`
    }

    return {
      ...doc,
      name: doc.original_name || doc.name,
      type: doc.mime_type || doc.file_type || doc.type, // Priorité à mime_type
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

      const newDoc = {
        id: result.id,
        filename: result.filename,
        original_name: result.original_name,
        name: result.original_name || result.filename,
        file_type: result.document_type,
        type: result.mime_type || result.document_type, 
        mime_type: result.mime_type,
        size_bytes: result.size_bytes,
        size: result.size_bytes,
        url: result.url?.startsWith('/')
          ? `${API_BASE_URL}${result.url}`
          : (result.url || `${API_BASE_URL}/uploads/${result.filename}`),
        document_type: result.document_type,
        status: result.status,
        numPages: 1, // Par défaut
        created_at: result.created_at,
        updated_at: result.updated_at
      }

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

    setDocumentVersion(prev => prev + 1)
  }
  const allPages = documents.flatMap(doc => {
    const docPages = doc.pages
      ? doc.pages.map(page => {
          let pageUrl = page.url
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
    console.log('🎯 DocumentsContext - eventEmitter:', eventEmitter ? '✅' : '❌ null')

    if (!eventEmitter) {
      console.warn('⚠️ eventEmitter is null, skipping listener setup')
      return
    }

    console.log('🎯 Setting up document processing listeners')

    const handleDocumentProcessing = (data) => {
      console.log('📄 Document processing event reçu:', data)

      if (data.status === 'processing' && data.page_url) {
        // Une nouvelle page a été extraite
        const newPage = {
          id: `${data.document_id}-${data.page_number - 1}`,
          documentId: data.document_id,
          pageNumber: data.page_number,
          originalPageNumber: data.page_number,
          url: `${API_BASE_URL}${data.page_url}`,
          documentName: documents.find(d => d.id === data.document_id)?.name || 'Document'
        }

        setOrderedPages(prev => {
          const exists = prev.some(p => p.id === newPage.id)
          if (!exists) {
            return [...prev, newPage]
          }
          return prev
        })

        queryClient.setQueryData(['documents', 'list'], (old) => {
          if (!old) return old

          return {
            ...old,
            documents: old.documents.map(doc => {
              if (doc.id === data.document_id) {
                const existingPages = doc.pages || []
                const pageExists = existingPages.some(p => p.pageNumber === data.page_number)

                if (!pageExists) {
                  const updatedPage = {
                    pageNumber: data.page_number,
                    url: newPage.url,
                    originalPageNumber: data.page_number
                  }

                  return {
                    ...doc,
                    pages: [...existingPages, updatedPage],
                    numPages: Math.max(doc.numPages || 1, data.page_number)
                  }
                }
              }
              return doc
            })
          }
        })

        setDocumentVersion(prev => prev + 1)
      } else if (data.status === 'completed') {
        queryClient.setQueryData(['documents', 'list'], (old) => {
          if (!old) return old

          return {
            ...old,
            documents: old.documents.map(doc => {
              if (doc.id === data.document_id) {
                return {
                  ...doc,
                  numPages: data.total_pages,
                  pages: data.pages.map(page => ({
                    ...page,
                    url: `${API_BASE_URL}${page.url}`
                  }))
                }
              }
              return doc
            })
          }
        })

        setDocumentVersion(prev => prev + 1)
      }
    }

    // S'abonner aux événements
    eventEmitter.on('document_processing', handleDocumentProcessing)
    eventEmitter.on('document_processing_error', handleDocumentProcessing)

    return () => {
      eventEmitter.off('document_processing', handleDocumentProcessing)
      eventEmitter.off('document_processing_error', handleDocumentProcessing)
    }
  }, [eventEmitter, queryClient, documents])

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
    const [docId, pageIndex] = pageId.split('-')
    const pageIndexNum = parseInt(pageIndex, 10)
    const doc = documents.find(d => d.id === docId)
    if (doc) {
      setSelectedDocumentId(docId)
      setSelectedPageNumber(pageIndexNum + 1)
      console.log('🎯 selectPageById:', { pageId, docId, pageIndex: pageIndexNum, pageNumber: pageIndexNum + 1, docName: doc.name })
    } else {
      console.warn('⚠️ Document non trouvé:', docId, 'documents:', documents.map(d => d.id))
    }
  }

  const selectedPageId = selectedDocumentId
    ? `${selectedDocumentId}-${(selectedPageNumber || 1) - 1}`
    : null

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
        type: doc.mime_type || doc.file_type || doc.type, // Priorité à mime_type
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
