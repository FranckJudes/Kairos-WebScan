import { createContext, useContext, useState, useRef, useEffect } from 'react'
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

  const seenPageIdsRef = useRef(new Set())

  // Récupérer les documents depuis le backend avec React Query
  // DÉSACTIVÉ par défaut pour comportement de session éphémère
  // (l'application ne charge PAS les documents de la BD au démarrage)
  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: () => documentsApi.listDocuments(0, 100),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Ne charge PAS automatiquement - seulement via upload
  })

  // Extraire les documents du résultat et normaliser les champs
  const documents = (documentsData?.documents || []).map(doc => ({
    ...doc,
    // Normaliser les noms de champs pour compatibilité frontend
    name: doc.original_name || doc.name,
    type: doc.file_type || doc.type,
    // URL complète avec le backend pour éviter les problèmes CORS
    url: doc.url || `${API_BASE_URL}/uploads/${doc.filename}`,
    createdAt: doc.created_at || doc.createdAt
  }))

  /**
   * Ajouter un document (upload vers le backend)
   */
  const addDocument = async (file) => {
    try {
      const result = await documentsApi.uploadDocument(file)

      if (result.success) {
        const newDoc = result.document

        // Refetch manuellement car enabled:false empêche invalidateQueries de fonctionner
        await refetch()

        // Sélectionner le nouveau document
        setSelectedDocumentId(newDoc.id)
        setSelectedPageNumber(1)

        console.log('✅ Document uploadé:', newDoc.original_name)
        return newDoc
      }
    } catch (error) {
      console.error('❌ Erreur upload document:', error)
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
      console.log(`✅ ${successCount}/${files.length} documents uploadés`)

      return results
    } catch (error) {
      console.error('❌ Erreur upload documents:', error)
      throw error
    }
  }

  /**
   * Supprimer un document
   */
  const removeDocument = async (id) => {
    try {
      await documentsApi.deleteDocument(id)

      // Refetch manuellement
      await refetch()

      // Si le document supprimé était sélectionné, en sélectionner un autre
      if (selectedDocumentId === id) {
        const remainingDocs = documents.filter(doc => doc.id !== id)
        setSelectedDocumentId(remainingDocs[0]?.id || null)
        setSelectedPageNumber(1)
      }

      console.log('✅ Document supprimé')
    } catch (error) {
      console.error('❌ Erreur suppression document:', error)
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

            // Mettre à jour les numéros de page
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

    // Mettre à jour la page sélectionnée si nécessaire
    if (selectedPageNumber === oldIndex + 1) {
      setSelectedPageNumber(newIndex + 1)
    } else if (selectedPageNumber === newIndex + 1) {
      setSelectedPageNumber(oldIndex + 1)
    }
  }

  /**
   * Obtenir toutes les pages de tous les documents sous forme de liste plate
   * Chaque page a un identifiant unique composé de: documentId-pageNumber
   */
  const allPages = documents.flatMap(doc => {
    const docPages = doc.pages || Array.from({ length: doc.numPages || 1 }, (_, i) => ({
      pageNumber: i + 1,
      url: doc.url
    }))
    return docPages.map((page, index) => ({
      ...page,
      id: `${doc.id}-${index}`,
      documentId: doc.id,
      documentName: doc.name,
      originalIndex: index
    }))
  })

  // Ref pour suivre les pages déjà vues dans la session

  // Connexion WebSocket pour les mises à jour temps réel
  const { eventEmitter } = useWebSocket()

  useEffect(() => {
    if (!eventEmitter) return

    const handleDocumentUploaded = (data) => {
      console.log('📡 WebSocket: Document uploaded', data)
      refetch()
    }

    eventEmitter.on('document_uploaded', handleDocumentUploaded)

    return () => {
      eventEmitter.off('document_uploaded', handleDocumentUploaded)
    }
  }, [eventEmitter, refetch])

  // Logique de persistance de session (déplacée depuis useOrganizePages)
  // Avec enabled:false sur la query, il n'y aura pas de documents au démarrage
  // On détecte simplement les uploads
  useEffect(() => {
    if (isLoading) return

    // Détecter les nouvelles pages (Upload uniquement, car pas de documents au démarrage)
    const newPages = allPages.filter(p => !seenPageIdsRef.current.has(p.id))

    if (newPages.length > 0) {
      console.log('✨ New pages uploaded:', newPages.length)

      // Ajouter aux pages vues
      newPages.forEach(p => seenPageIdsRef.current.add(p.id))

      // Ajouter à la liste "À classer"
      setOrderedPages(prev => [...prev, ...newPages])

      // Mettre à jour le cache query
      queryClient.setQueryData(['organize', 'orderedPages'], (old) => {
        return old ? [...old, ...newPages] : [...newPages]
      })
    }
  }, [allPages, isLoading, queryClient])

  /**
   * Sélectionner une page spécifique (par son ID unique)
   */
  const selectPageById = (pageId) => {
    const [docId, pageIndex] = pageId.split('-').map(Number)
    const doc = documents.find(d => d.id === docId)
    if (doc) {
      setSelectedDocumentId(docId)
      setSelectedPageNumber(pageIndex + 1)
    }
  }

  // Page sélectionnée actuelle (avec ID unique)
  const selectedPageId = selectedDocumentId
    ? `${selectedDocumentId}-${(selectedPageNumber || 1) - 1}`
    : null

  // Document sélectionné
  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId)

  const value = {
    documents,
    allPages,
    selectedPageId,
    setDocuments: (docs) => queryClient.setQueryData(['documents', 'list'], { documents: docs, total: docs.length }),
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
    orderedPages,
    setOrderedPages,
    classifiedPages,
    setClassifiedPages,
    isLoading,
    error,
    seenPageIdsRef, // Exposer pour useOrganizePages
  }

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}
