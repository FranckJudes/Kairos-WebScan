import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useRecentDocuments, useDeleteDocument, useRenameDocument, useInfiniteRecentDocuments } from '../../../hooks/useDocuments'
import { useDocuments } from '../../../contexts/DocumentsContext'
import useUserProfile from '../../../hooks/useUserProfile'
import { useVirtualizer } from '@tanstack/react-virtual'
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
  OpenInNewRounded,
  UploadFileRounded,
  DescriptionRounded,
  EditRounded,
  CheckRounded,
  CloseRounded,
  GroupRounded,
  SortByAlphaRounded,
  FolderOpenRounded,
  MoreHorizRounded,
  MoreVertRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import AccountFooter from './AccountFooter'
import { api } from '../../../services/api'

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, documentName, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-bgSecondary rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <DeleteRounded className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text">Supprimer le document</h3>
            <p className="text-sm text-slate-500 dark:text-dark-textTertiary">Action irréversible</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-dark-text mb-6">
          Êtes-vous sûr de vouloir supprimer <strong className="text-slate-900 dark:text-dark-text">"{documentName}"</strong> ?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors disabled:opacity-50 font-medium"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
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
    return <ArchiveRounded className={`${className} text-amber-500`} />
  }
  return <DescriptionRounded className={`${className} text-[#4285f4]`} />
}

// Menu d'actions (dropdown)
function ActionMenu({ doc, onDownload, onDelete, onRename, onClose }) {
  return (
    <div
      className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 z-[100] py-1 animate-in fade-in slide-in-from-top-2 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(doc); onClose(); }}
        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
      >
        <DownloadRounded className="w-4 h-4 mr-3 text-gray-400" />
        Télécharger
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onRename(doc); onClose(); }}
        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
      >
        <EditRounded className="w-4 h-4 mr-3 text-gray-400" />
        Renommer
      </button>
      <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1" />
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(doc); onClose(); }}
        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <DeleteRounded className="w-4 h-4 mr-3 text-red-400" />
        Supprimer
      </button>
    </div>
  )
}

// Composant d'aperçu de document (Vignette)
function Thumbnail({ doc }) {
  const API_BASE_URL = import.meta.env.VITE_API_URL
  const displayName = getDisplayName(doc, 0)
  const mimeType = doc.mime_type || doc.file_type || doc.type || ''

  let pages = doc.pages
  if (typeof pages === 'string') {
    try { pages = JSON.parse(pages) } catch (e) { pages = null }
  }
  const firstPage = (Array.isArray(pages) && pages[0]) || null
  const firstPageUrl = (firstPage?.image_url || firstPage?.url || (typeof firstPage === 'string' ? firstPage : null))

  const thumbnailUrl = doc.thumbnail_url || doc.thumbnail || firstPageUrl || (mimeType.includes('image') ? doc.url : null)
  const baseUrl = API_BASE_URL || ''
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  let fullThumbnailUrl = null
  if (thumbnailUrl) {
    fullThumbnailUrl = thumbnailUrl.startsWith('http')
      ? thumbnailUrl
      : `${cleanBaseUrl}${thumbnailUrl.startsWith('/') ? '' : '/'}${thumbnailUrl}`
  }

  if (fullThumbnailUrl) {
    return (
      <div className="h-full w-full border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden bg-white">
        <img
          src={fullThumbnailUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null
            e.target.parentNode.innerHTML = '<div class="h-full flex items-center justify-center bg-gray-50 text-gray-300 text-[10px]">Image non dispo</div>'
          }}
        />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-dark-bgSecondary h-full w-full border border-gray-200 dark:border-dark-border p-4 shadow-sm text-[8px] leading-tight text-gray-500 overflow-hidden select-none">
      <div className="flex items-center gap-1 mb-2">
        <FileIcon mimeType={mimeType} className="w-3 h-3" />
        <h3 className="font-bold text-gray-900 dark:text-white text-[10px] truncate">
          {displayName.toUpperCase()}
        </h3>
      </div>
      <div className="space-y-2 mt-4 opacity-50">
        <div className="h-1.5 w-3/4 bg-gray-100 dark:bg-dark-bgTertiary rounded"></div>
        <div className="h-1.5 w-full bg-gray-50 dark:bg-dark-bgTertiary/50 rounded"></div>
        <div className="h-1.5 w-5/6 bg-gray-100 dark:bg-dark-bgTertiary rounded"></div>
        <div className="h-1.5 w-full bg-gray-50 dark:bg-dark-bgTertiary/50 rounded"></div>
        <div className="mt-4 h-12 w-full bg-gray-50 dark:bg-dark-bgTertiary/30 rounded"></div>
      </div>
    </div>
  )
}

// Vue en Liste (Virtualisée)
function VirtualListView({ parentRef, virtualizer, items, onDownload, onDelete, onOpen, onStartEdit, openMenuId, onOpenMenu }) {
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="h-[calc(100vh-300px)] overflow-auto scrollbar-hide pb-20">
      <div
        className="w-full relative"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          if (!item) return null

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              <div
                className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover/50 group transition-colors cursor-pointer border-b border-gray-100 dark:border-dark-border"
                onClick={() => onOpen(item)}
              >
                <div className="flex-1 flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0">
                    <FileIcon mimeType={item.mime_type || item.file_type || item.type} className="text-[24px]" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{getDisplayName(item, virtualItem.index)}</span>
                    {item.shared && (
                      <GroupRounded className="w-4 h-4 text-gray-400" title="Partagé" />
                    )}
                  </div>
                </div>

                <div className="w-32 hidden md:block text-sm text-gray-500">
                  {item.owner || 'moi'}
                </div>

                <div className="w-48 text-sm text-gray-500">
                  {formatDate(item)}
                </div>

                <div className="w-10 text-right relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenMenu(item.id)
                    }}
                    className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all ${openMenuId === item.id ? 'bg-gray-200 dark:bg-gray-700 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Plus d'actions"
                  >
                    <MoreVertRounded className="text-gray-500" />
                  </button>
                  {openMenuId === item.id && (
                    <ActionMenu
                      doc={item}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onRename={onStartEdit}
                      onClose={() => onOpenMenu(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Vue en Grille (Virtualisée)
function VirtualCardView({ parentRef, virtualizer, items, columns, onDownload, onDelete, onOpen, onStartEdit, openMenuId, onOpenMenu }) {
  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className="h-[calc(100vh-300px)] overflow-auto pb-20 scrollbar-hide">
      <div
        className="w-full relative"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const rowItems = items.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.key}
              className="absolute top-0 left-0 w-full flex gap-6 px-1 py-3"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {rowItems.map((doc, colIndex) => {
                const index = startIndex + colIndex
                const displayName = getDisplayName(doc, index)

                return (
                  <div
                    key={doc.id}
                    className="flex-1 bg-white dark:bg-dark-bgSecondary border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-all group flex flex-col shadow-sm"
                    onClick={() => onOpen(doc)}
                  >
                    {/* Preview Area */}
                    <div className="aspect-[4/3] bg-gray-50 dark:bg-dark-bgTertiary flex items-center justify-center relative group/preview overflow-hidden">
                      <Thumbnail doc={doc} />
                    </div>

                    {/* Info Area */}
                    <div className="p-3 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-dark-border mt-auto">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0">
                          <FileIcon mimeType={doc.mime_type || doc.file_type || doc.type} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={displayName}>
                            {displayName}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatDate(doc)}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors ${openMenuId === doc.id ? 'bg-gray-100 dark:bg-zinc-800 text-blue-600' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenMenu(doc.id)
                          }}
                        >
                          <MoreVertRounded className="w-5 h-5" />
                        </button>
                        {openMenuId === doc.id && (
                          <ActionMenu
                            doc={doc}
                            onDownload={onDownload}
                            onDelete={onDelete}
                            onRename={onStartEdit}
                            onClose={() => onOpenMenu(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {/* Padding pour les colonnes manquantes */}
              {Array.from({ length: Math.max(0, columns - rowItems.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1" />
              ))}
            </div>
          )
        })}
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

function isUUID(str) {
  if (!str) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const nameWithoutExt = str.replace(/\.[^/.]+$/, '')
  return uuidRegex.test(nameWithoutExt)
}

function getDisplayName(doc, index) {
  if (doc.display_name) {
    return doc.display_name
  }
  if (doc.original_name && !isUUID(doc.original_name)) {
    return doc.original_name
  }
  if (doc.filename && !isUUID(doc.filename)) {
    return doc.filename
  }
  const ext = doc.filename?.match(/\.[^/.]+$/)?.[0] || doc.original_name?.match(/\.[^/.]+$/)?.[0] || ''
  return `Document ${index + 1}${ext}`
}

function formatDate(doc) {
  if (!doc) return 'Date inconnue'

  // Priorité absolue aux champs formatés par le backend
  if (doc.relative_date) return doc.relative_date
  if (doc.date_display) return doc.date_display
  if (doc.formatted_date) return doc.formatted_date

  const dateString = doc.created_at || doc.createdAt || doc.date || doc.updated_at
  if (!dateString || dateString === 'Invalid Date' || dateString === 'null' || dateString === 'undefined') return 'Date inconnue'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Date inconnue'

  // Fallback simple si le backend n'a pas encore fourni de date relative
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const API_BASE_URL = import.meta.env.VITE_API_URL

const AccountDocuments = () => {
  const { user } = useUserProfile()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setSelectedDocumentId, setSelectedPageNumber } = useDocuments()
  const [viewMode, setViewMode] = useState('card')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, doc: null })

  // Hook pour le scroll infini
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteRecentDocuments(20) // Section de 20 documents par chargement

  // Aplatir les pages de documents
  const allDocuments = useMemo(() => {
    return data?.pages.flatMap(page => page) || []
  }, [data])

  // Virtualisation logic
  const parentRef = useRef()
  const columnCount = useMemo(() => {
    if (viewMode === 'list') return 1
    // Estimation simple des colonnes selon la largeur (pourrait être amélioré avec un ResizeObserver)
    return 4
  }, [viewMode])

  const rowCount = useMemo(() => {
    return viewMode === 'list'
      ? allDocuments.length
      : Math.ceil(allDocuments.length / columnCount)
  }, [allDocuments.length, viewMode, columnCount])

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (viewMode === 'list' ? 60 : 360),
    overscan: 5,
  })

  // Infinite Scroll Trigger
  useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems()
    if (virtualItems.length === 0) return

    const lastItem = virtualItems[virtualItems.length - 1]
    if (lastItem.index >= rowCount - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, rowCount, fetchNextPage])

  const deleteDocumentMutation = useDeleteDocument()
  const renameDocumentMutation = useRenameDocument()

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#106EBE] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

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
    link.href = doc.url?.startsWith('/') ? `${import.meta.env.VITE_API_URL}${doc.url}` : doc.url
    link.download = getDisplayName(doc, 0)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const startEditing = (doc, index = 0) => {
    setEditingId(doc.id)
    setEditName(getDisplayName(doc, index))
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEditing = async (doc) => {
    if (!editName.trim()) {
      toast.error('Le nom ne peut pas être vide')
      return
    }
    try {
      await renameDocumentMutation.mutateAsync({ documentId: doc.id, displayName: editName.trim() })
      toast.success('Document renommé')
      setEditingId(null)
      setEditName('')
    } catch (error) {
      toast.error('Erreur lors du renommage')
    }
  }

  const handleKeyDown = (e, doc) => {
    if (e.key === 'Enter') {
      saveEditing(doc)
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const handleOpenDocument = async (doc) => {
    try {
      const fullDoc = await api.getDocument(doc.id)

      const normalizedDoc = {
        id: fullDoc.id,
        filename: fullDoc.filename,
        original_name: fullDoc.original_name,
        name: getDisplayName(fullDoc, 0),
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

      queryClient.setQueryData(['documents', 'list'], (old) => {
        const currentDocs = old?.documents || []
        const exists = currentDocs.find(d => d.id === doc.id)
        if (exists) {
          return {
            ...old,
            documents: currentDocs.map(d => d.id === doc.id ? normalizedDoc : d),
            total: old?.total || currentDocs.length
          }
        }
        return {
          ...old,
          documents: [normalizedDoc, ...currentDocs],
          total: (old?.total || 0) + 1
        }
      })

      setSelectedDocumentId(doc.id)
      setSelectedPageNumber(1)

      navigate('/')
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du document')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      {/* Header - Style modernisé */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Les 30 jours précédents
        </h1>

        <div className="flex items-center gap-6">
          <button className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded transition-colors group">
            <span className="text-sm font-medium">Tous</span>
            <span className="material-symbols-rounded text-[20px] text-gray-400 group-hover:text-gray-600">arrow_drop_down</span>
          </button>

          <div className="hidden lg:flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded transition-colors">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dernière ouverture par moi</span>
          </div>

          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-dark-border pl-4">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors ${viewMode === 'list' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400'}`}
              title="Vue en liste"
            >
              <ViewListRounded className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors ${viewMode === 'card' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400'}`}
              title="Vue en grille"
            >
              <ViewModuleRounded className="w-5 h-5" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors text-gray-600 dark:text-gray-400" title="Trier">
              <SortByAlphaRounded className="w-5 h-5" />
            </button>
            <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors text-gray-600 dark:text-gray-400" title="Ouvrir le dossier">
              <FolderOpenRounded className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 dark:border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-dark-bgSecondary border border-gray-200 dark:border-dark-border rounded-xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <FolderRounded className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-900 dark:text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Impossible de charger vos documents
          </p>
        </div>
      ) : allDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-dark-bgSecondary border border-gray-200 dark:border-dark-border rounded-xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4">
            <DescriptionRounded className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-900 dark:text-white font-medium mb-1">Aucun document</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Vous n'avez pas encore de document sauvegardé
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <UploadFileRounded className="w-4 h-4" />
            Importer un document
          </button>
        </div>
      ) : (
        <div
          className="py-2"
          onClick={() => setOpenMenuId(null)} // Ferme le menu au clic n'importe où
        >
          {viewMode === 'list' ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
              {/* Header du tableau */}
              <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                <div className="flex-1">Nom</div>
                <div className="w-32 hidden md:block">Propriétaire</div>
                <div className="w-48">Dernière modification</div>
                <div className="w-10"></div>
              </div>
              <VirtualListView
                parentRef={parentRef}
                virtualizer={virtualizer}
                items={allDocuments}
                onDownload={handleDownload}
                onDelete={openDeleteModal}
                onOpen={handleOpenDocument}
                onStartEdit={startEditing}
                openMenuId={openMenuId}
                onOpenMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
                isFetchingNextPage={isFetchingNextPage}
              />
            </div>
          ) : (
            <VirtualCardView
              parentRef={parentRef}
              virtualizer={virtualizer}
              items={allDocuments}
              columns={columnCount}
              onDownload={handleDownload}
              onDelete={openDeleteModal}
              onOpen={handleOpenDocument}
              onStartEdit={startEditing}
              openMenuId={openMenuId}
              onOpenMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
              isFetchingNextPage={isFetchingNextPage}
            />
          )}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        documentName={deleteModal.doc ? getDisplayName(deleteModal.doc, 0) : 'ce document'}
        isDeleting={deleteDocumentMutation.isPending}
      />



      <AccountFooter />
    </div>
  )
}

export default AccountDocuments