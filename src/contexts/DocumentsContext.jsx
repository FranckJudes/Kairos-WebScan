import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '../hooks/useDocumentsApi'

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

  // Récupérer les documents depuis le backend avec React Query
  const { data: documentsData, isLoading, error } = useQuery({
    queryKey: ['documents', 'list'],
    queryFn: () => documentsApi.listDocuments(0, 100), // Charger jusqu'à 100 documents
    staleTime: 1000 * 60 * 5, // 5 minutes
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

        // Invalider le cache pour rafraîchir la liste
        await queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })

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

      // Invalider le cache
      await queryClient.invalidateQueries({ queryKey: ['documents', 'list'] })

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
  }

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}
