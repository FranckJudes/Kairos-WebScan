import { createContext, useContext, useState } from 'react'

const DocumentsContext = createContext(null)

export function useDocuments() {
  const context = useContext(DocumentsContext)
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentsProvider')
  }
  return context
}

export function DocumentsProvider({ children }) {
  const [documents, setDocuments] = useState([])
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [selectedPageNumber, setSelectedPageNumber] = useState(1)

  const addDocument = (file) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const newDocument = {
        id: Date.now(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: e.target.result,
        createdAt: new Date().toISOString(),
        numPages: file.type === 'application/pdf' ? null : 1, // null = PDF, sera calculé plus tard
      }

      setDocuments((prev) => [...prev, newDocument])
      setSelectedDocumentId(newDocument.id)
      setSelectedPageNumber(1)
    }

    reader.readAsDataURL(file)
  }

  const addDocuments = (files) => {
    Array.from(files).forEach((file) => {
      addDocument(file)
    })
  }

  const removeDocument = (id) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    if (selectedDocumentId === id) {
      setSelectedDocumentId(documents[0]?.id || null)
      setSelectedPageNumber(1)
    }
  }

  const clearDocuments = () => {
    setDocuments([])
    setSelectedDocumentId(null)
    setSelectedPageNumber(1)
  }

  const updateDocumentNumPages = (id, numPages) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, numPages } : doc
      )
    )
  }

  const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId)

  const value = {
    documents,
    setDocuments,
    selectedDocument,
    selectedDocumentId,
    selectedPageNumber,
    setSelectedDocumentId,
    setSelectedPageNumber,
    addDocument,
    addDocuments,
    removeDocument,
    clearDocuments,
    updateDocumentNumPages,
  }

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}
