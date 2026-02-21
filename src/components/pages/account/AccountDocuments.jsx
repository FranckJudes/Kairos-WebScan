import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useRecentDocuments, useDeleteDocument } from '../../../hooks/useDocuments'
import { useDocuments } from '../../../contexts/DocumentsContext'
import { 
  FolderRounded, 
  DeleteRounded, 
  DownloadRounded, 
  ViewListRounded, 
  ViewModuleRounded,
  InsertDriveFileRounded,
  ImageRounded,
  ArchiveRounded,
  PictureAsPdfRounded,
  OpenInNewRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'

// Modal de confirmation de suppression
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, documentName, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <DeleteRounded className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#605e5c] dark:text-dark-text">Supprimer le document</h3>
        </div>
        <p className="text-sm text-[#605e5c] dark:text-dark-text mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>"{documentName}"</strong> ? Cette action est irréversible.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-[#edebe9] dark:border-dark-border text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant pour l'icône de fichier selon le type
function FileIcon({ mimeType, className = "w-6 h-6" }) {
  if (mimeType?.includes('pdf')) {
    return <PictureAsPdfRounded className={`${className} text-red-500`} />
  }
  if (mimeType?.includes('image')) {
    return <ImageRounded className={`${className} text-blue-500`} />
  }
  if (mimeType?.includes('zip') || mimeType?.includes('archive')) {
    return <ArchiveRounded className={`${className} text-yellow-600`} />
  }
  return <InsertDriveFileRounded className={`${className} text-gray-500`} />
}

// Vue en Cards (Grille)
function CardView({ documents, onDownload, onDelete, onOpen }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white dark:bg-dark-bgSecondary rounded-xl border border-[#edebe9] dark:border-dark-border p-4 hover:shadow-lg hover:border-[#106EBE] dark:hover:border-blue-500 transition-all group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gray-50 dark:bg-dark-bgTertiary rounded-xl flex items-center justify-center">
              <FileIcon mimeType={doc.mime_type} className="w-7 h-7" />
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onOpen(doc)}
                className="p-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
                title="Ouvrir"
              >
                <OpenInNewRounded className="w-4 h-4 text-[#106EBE] dark:text-blue-500" />
              </button>
              <button
                onClick={() => onDownload(doc)}
                className="p-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
                title="Télécharger"
              >
                <DownloadRounded className="w-4 h-4 text-[#605e5c] dark:text-dark-text" />
              </button>
              <button
                onClick={() => onDelete(doc)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Supprimer"
              >
                <DeleteRounded className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-[#605e5c] dark:text-dark-text truncate mb-1" title={doc.original_name || doc.filename}>
            {doc.original_name || doc.filename}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
            <span>{formatFileSize(doc.size_bytes)}</span>
            <span>{formatDate(doc.created_at)}</span>
          </div>
          
          <div className="mt-3 pt-3 border-t border-[#edebe9] dark:border-dark-border">
            <span className="text-xs px-2 py-1 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-full text-[#605e5c] dark:text-dark-text">
              {doc.document_type}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Vue en Liste (Tableau)
function ListView({ documents, onDownload, onDelete, onOpen }) {
  return (
    <div className="bg-white dark:bg-dark-bgSecondary rounded-xl border border-[#edebe9] dark:border-dark-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#f3f2f1] dark:bg-dark-bgTertiary border-b border-[#edebe9] dark:border-dark-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Document
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider hidden sm:table-cell">
                Taille
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider hidden md:table-cell">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edebe9] dark:divide-dark-border">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-dark-bgTertiary rounded-lg flex items-center justify-center">
                      <FileIcon mimeType={doc.mime_type} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text truncate max-w-[200px] sm:max-w-[300px]">
                        {doc.original_name || doc.filename}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-sm text-[#605e5c] dark:text-dark-text">
                    {formatFileSize(doc.size_bytes)}
                  </span>
                </td>

                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-sm text-[#605e5c] dark:text-dark-text">
                    {doc.document_type}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <span className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                    {formatDate(doc.created_at)}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpen(doc)}
                      className="p-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
                      title="Ouvrir"
                    >
                      <OpenInNewRounded className="w-4 h-4 text-[#106EBE] dark:text-blue-500" />
                    </button>
                    <button
                      onClick={() => onDownload(doc)}
                      className="p-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
                      title="Télécharger"
                    >
                      <DownloadRounded className="w-4 h-4 text-[#605e5c] dark:text-dark-text" />
                    </button>
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <DeleteRounded className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Fonctions utilitaires
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Aujourd'hui"
  } else if (diffDays === 1) {
    return 'Hier'
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL

const AccountDocuments = ({ user }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setSelectedDocumentId, setSelectedPageNumber } = useDocuments()
  const [viewMode, setViewMode] = useState('card') // 'card' ou 'list'
  const { data: documents, isLoading, error } = useRecentDocuments(5)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, doc: null })
  const deleteDocumentMutation = useDeleteDocument()

  const openDeleteModal = (doc) => {
    setDeleteModal({ isOpen: true, doc })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, doc: null })
  }

  const confirmDelete = async () => {
    if (deleteModal.doc) {
      try {
        await deleteDocumentMutation.mutateAsync(deleteModal.doc.id)
        toast.success('Document supprimé avec succès')
        closeDeleteModal()
      } catch (error) {
        toast.error(error.message || 'Erreur lors de la suppression')
      }
    }
  }

  const handleDownload = (doc) => {
    const link = document.createElement('a')
    link.href = doc.url
    link.download = doc.original_name || doc.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenDocument = async (doc) => {
    try {
      // Récupérer le document complet depuis l'API pour avoir tous les champs
      const fullDoc = await api.getDocument(doc.id)
      
      // Normaliser le document au format attendu par DocumentsContext
      const normalizedDoc = {
        id: fullDoc.id,
        filename: fullDoc.filename,
        original_name: fullDoc.original_name,
        name: fullDoc.original_name || fullDoc.filename,
        file_type: fullDoc.document_type,
        type: fullDoc.mime_type || fullDoc.document_type,
        mime_type: fullDoc.mime_type,
        size_bytes: fullDoc.size_bytes,
        size: fullDoc.size_bytes,
        url: fullDoc.url?.startsWith('/') 
          ? `${API_BASE_URL}${fullDoc.url}` 
          : (fullDoc.url || `${API_BASE_URL}/uploads/${fullDoc.filename}`),
        document_type: fullDoc.document_type,
        status: fullDoc.status,
        numPages: fullDoc.num_pages || 1,
        created_at: fullDoc.created_at,
        updated_at: fullDoc.updated_at,
        pages: fullDoc.pages || []
      }
      
      // Ajouter au cache de la liste
      queryClient.setQueryData(['documents', 'list'], (old) => {
        const currentDocs = old?.documents || []
        const exists = currentDocs.find(d => d.id === doc.id)
        if (exists) {
          // Mettre à jour le document existant
          return {
            ...old,
            documents: currentDocs.map(d => d.id === doc.id ? normalizedDoc : d),
            total: old?.total || currentDocs.length
          }
        }
        // Ajouter le nouveau document
        return {
          ...old,
          documents: [normalizedDoc, ...currentDocs],
          total: (old?.total || 0) + 1
        }
      })
      
      // Définir le document comme sélectionné
      setSelectedDocumentId(doc.id)
      setSelectedPageNumber(1)
      
      // Naviguer vers l'accueil
      navigate('/')
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du document')
      console.error(error)
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header avec toggle de vue */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text">
            Documents récents
          </h2>
          <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary mt-1">
            {documents?.length || 0} document{documents?.length > 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Toggle Vue Card/List */}
        <div className="flex items-center gap-1 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'card' 
                ? 'bg-white dark:bg-dark-bgSecondary shadow-sm text-[#106EBE] dark:text-blue-500' 
                : 'text-[#c8c6c4] dark:text-dark-textTertiary hover:text-[#605e5c] dark:hover:text-dark-text'
            }`}
            title="Vue en grille"
          >
            <ViewModuleRounded className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-dark-bgSecondary shadow-sm text-[#106EBE] dark:text-blue-500' 
                : 'text-[#c8c6c4] dark:text-dark-textTertiary hover:text-[#605e5c] dark:hover:text-dark-text'
            }`}
            title="Vue en liste"
          >
            <ViewListRounded className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#106EBE] dark:border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <FolderRounded className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-[#605e5c] dark:text-dark-text mb-2">Erreur de chargement</p>
          <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
            Impossible de charger vos documents
          </p>
        </div>
      ) : documents?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-bgSecondary rounded-xl border border-[#edebe9] dark:border-dark-border">
          <FolderRounded className="w-16 h-16 text-[#c8c6c4] dark:text-dark-textTertiary mx-auto mb-4" />
          <p className="text-[#605e5c] dark:text-dark-text mb-2">Aucun document</p>
          <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
            Vous n'avez pas encore de document sauvegardé
          </p>
        </div>
      ) : (
        viewMode === 'card' ? (
          <CardView 
            documents={documents} 
            onDownload={handleDownload} 
            onDelete={openDeleteModal}
            onOpen={handleOpenDocument}
          />
        ) : (
          <ListView 
            documents={documents} 
            onDownload={handleDownload} 
            onDelete={openDeleteModal}
            onOpen={handleOpenDocument}
          />
        )
      )}

      {/* Modal de confirmation de suppression */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        documentName={deleteModal.doc?.original_name || deleteModal.doc?.filename || 'ce document'}
        isDeleting={deleteDocumentMutation.isPending}
      />
    </div>
  )
}

export default AccountDocuments
