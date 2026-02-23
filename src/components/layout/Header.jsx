import { useState, useEffect, useRef } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { HamburgerButton } from '../ui/MobileSidebar'
import DarkModeToggle from '../ui/DarkModeToggle'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useBannettes } from '../../hooks/useBannettes'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSearchDocuments } from '../../hooks/useDocuments'
import { api } from '../../services/api'
import AccountMenu from '../AccountMenu'
import LoginRounded from '@mui/icons-material/LoginRounded'
import toast from 'react-hot-toast'
import {
  CloseRounded,
  FolderOpenRounded,
  FolderRounded,
  DeleteRounded,
  ChevronLeftRounded,
  FileOpenRounded,
  ChevronRightRounded,
  DescriptionRounded,
  UploadFileRounded,
  SearchRounded,
  PictureAsPdfRounded,
  ImageRounded,
  InsertDriveFileRounded,
  OpenInNewRounded,
  FilterListRounded,
  AddRounded,
  EditRounded,
  SaveRounded
} from '@mui/icons-material'

function CreateBannetteModal({ isOpen, onClose, onCreateBannette, isCreating }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onCreateBannette(name.trim(), description.trim() || null)
      setName('')
      setDescription('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-dark-bgSecondary rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-flex">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#605e5c] dark:text-dark-text">Créer une bannette</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#f3f2f1] dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text"
            >
              <CloseRounded />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-2">
              Nom de la bannette *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg focus:ring-2 focus:ring-[#106EBE] focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
              placeholder="Entrez un nom pour votre bannette"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg focus:ring-2 focus:ring-[#106EBE] focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
              placeholder="Entrez une description pour votre bannette"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="px-4 py-2 bg-[#106EBE] hover:bg-[#005a9e] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BannettesModal({ isOpen, onClose, bannettes, onLoadBannette, onDeleteBannette, isDeleting, isLoading, currentPage, totalPages, total, goToPage, prevPage, nextPage }) {
  const [activeTab, setActiveTab] = useState(0)

  // S'assurer que activeTab est toujours valide
  useEffect(() => {
    if (bannettes.length > 0 && activeTab >= bannettes.length) {
      setActiveTab(bannettes.length - 1)
    }
  }, [bannettes, activeTab])
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Utiliser react-query pour charger tous les documents de toutes les bannettes
  const { data: allBannetteDocuments = {}, isLoading: isFetchingDocuments } = useQuery({
    queryKey: ['all-bannette-documents', isOpen, bannettes.length],
    queryFn: async () => {
      if (!isOpen || bannettes.length === 0) return {}

      const documentsMap = {}
      for (const bannette of bannettes) {
        if (bannette.id) {
          try {
            const response = await api.getDocumentsByBannette(bannette.id)
            documentsMap[bannette.id] = response.documents || []
          } catch (error) {
            console.error(`Error fetching documents for bannette ${bannette.id}:`, error)
            documentsMap[bannette.id] = []
          }
        }
      }
      return documentsMap
    },
    enabled: isOpen && bannettes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  
  // Obtenir les documents pour la bannette active
  const bannetteDocuments = allBannetteDocuments[bannettes[activeTab]?.id] || []

  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-dark-bgSecondary rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#605e5c] dark:text-dark-text">Mes Bannettes</h2>
            <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
              {bannettes.length} bannette{bannettes.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#f3f2f1] dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text"
          >
            <CloseRounded />
          </button>
        </div>

        {/* Tabs des bannettes */}
        {bannettes && bannettes.length > 0 && (
          <div className="border-b border-[#edebe9] dark:border-dark-border">
            <div className="flex overflow-x-auto">
              {bannettes.map((bannette, index) => (
                <button
                  key={bannette.id}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap min-w-[150px] ${
                    activeTab === index
                      ? 'border-[#106EBE] text-[#106EBE] dark:text-blue-400'
                      : 'border-transparent text-[#605e5c] dark:text-dark-text hover:text-[#106EBE] dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FolderRounded className="text-[18px]" />
                    <span className="truncate">{bannette.name}</span>
                    <span className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                      ({bannette.total_pages})
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contenu du tab actif */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-6 h-6 border-2 border-[#106EBE] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-[#605e5c] dark:text-dark-text">
                Chargement des bannettes...
              </p>
            </div>
          ) : bannettes.length === 0 || !bannettes[0] ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpenRounded className="text-[50px] text-[#c8c6c4] dark:text-dark-textTertiary mb-3" />
              <p className="text-sm text-[#605e5c] dark:text-dark-text">
                Aucune bannette sauvegardée
              </p>
            </div>
          ) : (
            <div className="p-6">
              {bannettes[activeTab] && (
                <>
                  <div className="mb-4">
                    <h3 className="text-md font-semibold text-[#605e5c] dark:text-dark-text mb-2">
                      {bannettes[activeTab].name}
                    </h3>
                    {bannettes[activeTab].description && (
                      <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                        {bannettes[activeTab].description}
                      </p>
                    )}
                  </div>

                  {/* Documents dans la bannette */}
                  <div>
                    <h4 className="text-sm font-medium text-[#605e5c] dark:text-dark-text mb-3 uppercase tracking-wider">
                      Documents
                    </h4>
                    {isFetchingDocuments ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-[#106EBE] border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-[#605e5c] dark:text-dark-text">Chargement...</span>
                      </div>
                    ) : bannetteDocuments && bannetteDocuments.length > 0 ? (
                      <div className="space-y-2">
                        {bannetteDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg hover:bg-[#e8e6e3] dark:hover:bg-dark-hover transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded bg-white dark:bg-dark-bg flex items-center justify-center">
                                <FileIcon mimeType={doc.mime_type} className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                                  {getDisplayName(doc)}
                                </p>
                                <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                                  {doc.document_type} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // Load document
                                  navigate('/documents')
                                }}
                                className="p-2 text-[#106EBE] dark:text-blue-600 hover:bg-[#f3f2f1] dark:bg-dark-hover rounded transition-colors"
                                title="Ouvrir"
                              >
                                <OpenInNewRounded className="text-[18px]" />
                              </button>
                              <button
                                onClick={() => onLoadBannette(bannettes[activeTab])}
                                className="p-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded transition-colors"
                                title="Charger"
                              >
                                <FolderOpenRounded className="text-[18px]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileOpenRounded className="text-[40px] text-[#c8c6c4] dark:text-dark-textTertiary mx-auto mb-2" />
                        <p className="text-sm text-[#605e5c] dark:text-dark-text">
                          Aucun document dans cette bannette
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#edebe9] dark:border-dark-border flex items-center justify-between">
          <div className="text-sm text-[#605e5c] dark:text-dark-text">
            Affichage {currentPage + 1}-{totalPages} sur {total} bannette{total > 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(0)}
              disabled={currentPage === 0}
              className="px-3 py-1 text-xs text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded transition-colors disabled:opacity-50"
            >
              Première
            </button>
            <div className="flex items-center space-x-1">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="p-1 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded transition-colors disabled:opacity-50"
                title="Page précédente"
              >
                <ChevronLeftRounded className="text-[18px]" />
              </button>
              <span className="text-xs text-[#605e5c] dark:text-dark-text px-2">
                Page {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages - 1}
                className="p-1 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded transition-colors disabled:opacity-50"
                title="Page suivante"
              >
                <ChevronRightRounded className="text-[18px]" />
              </button>
            </div>
            <button
              onClick={() => goToPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className="px-3 py-1 text-xs text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded transition-colors disabled:opacity-50"
            >
              Dernière
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

function FileIcon({ mimeType, className = "w-5 h-5" }) {
  if (mimeType?.includes('pdf')) {
    return <PictureAsPdfRounded className={`${className} text-red-500`} />
  }
  if (mimeType?.includes('image')) {
    return <ImageRounded className={`${className} text-blue-500`} />
  }
  return <InsertDriveFileRounded className={`${className} text-slate-400`} />
}

function getDisplayName(doc) {
  if (doc.display_name) return doc.display_name
  if (doc.original_name) return doc.original_name
  return doc.filename
}

function SearchModal({ isOpen, onClose, onOpenDocument }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState(null)
  const inputRef = useRef(null)

  const { data: results, isLoading } = useSearchDocuments(debouncedQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
    if (!isOpen) {
      setQuery('')
      setDebouncedQuery('')
      setSelectedFilter(null)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const filters = [
    { id: 'all', label: 'Tous' },
    { id: 'PDF', label: 'PDF' },
    { id: 'IMAGE', label: 'Image' },
  ]

  const filteredResults = results?.filter(doc => {
    if (!selectedFilter || selectedFilter === 'all') return true
    if (selectedFilter === 'PDF') return doc.mime_type?.includes('pdf') || doc.document_type === 'PDF'
    if (selectedFilter === 'IMAGE') return doc.mime_type?.includes('image')
    return true
  }) || []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10" />

      <div
        className="relative z-20 w-full max-w-3xl mx-4 bg-white dark:bg-[#0b121f] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec input de recherche */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative flex items-center">
            <SearchRounded className="absolute left-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#106EBE] focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 font-medium transition-all outline-none"
              placeholder="Rechercher dans vos documents..."
            />
            <button
              onClick={onClose}
              className="absolute right-4 text-slate-400 hover:text-red-500 transition-colors"
            >
              <CloseRounded />
            </button>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            <FilterListRounded className="text-slate-400 text-sm flex-shrink-0" />
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${selectedFilter === filter.id || (!selectedFilter && filter.id === 'all')
                    ? 'bg-[#106EBE] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#106EBE] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : query && filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DescriptionRounded className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Aucun résultat</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Essayez avec d'autres mots-clés</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''} pour "<span class="text-[#106EBE]">{query}</span>"
              </div>
              {filteredResults.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    onOpenDocument(doc)
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <FileIcon mimeType={doc.mime_type} className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {getDisplayName(doc)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {doc.document_type} • {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <OpenInNewRounded className="text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <SearchRounded className="text-4xl text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">Tapez pour rechercher</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Recherchez dans vos documents récents</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 text-[10px]">ESC</kbd>
              Fermer
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Header({ onToggleSidebar, isSidebarOpen }) {
  const [showBannettes, setShowBannettes] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [showCreateBannette, setShowCreateBannette] = useState(false)
  const { isDarkMode } = useDarkMode()
  const {
    bannettes,
    getAllBannettes,
    total,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    isLoading,
    deleteBannette,
    loadBannette,
    createBannette,
    createDefaultBannette,
    isCreating,
    isCreatingDefault,
    selectBannette,
    selectedBannetteId
  } = useBannettes()
  const navigate = useNavigate()
  const { setOrderedPages, setClassifiedPages, addDocuments, setSelectedDocumentId, setSelectedPageNumber } = useDocuments()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  const handleLoadBannette = async (bannette) => {
    try {
      const data = await loadBannette(bannette.id)

      // Sélectionner cette bannette
      selectBannette(bannette.id)

      if (data.pages_order && data.pages_order.length > 0) {
        setOrderedPages(data.pages_order)
      }

      // Restaurer les pages classées
      if (data.classified_pages) {
        setClassifiedPages(data.classified_pages)
      }

      setShowBannettes(false)
      toast.success(`Bannette "${bannette.name}" chargée avec succès !`)
    } catch (error) {
      toast.error('Erreur lors du chargement de la bannette')
    }
  }

  const handleUploadDocuments = async (files) => {
    if (!selectedBannetteId) {
      toast.error('Veuillez sélectionner une bannette avant d\'uploader des documents')
      return
    }

    // Modifier la requête d'upload pour inclure la bannette
    const originalInput = document.getElementById('header-file-input')

    // Créer un FormData pour inclure la bannette_id
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })
    formData.append('bannette_id', selectedBannetteId)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/upload/batch`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(error.detail || 'Failed to upload documents')
      }

      const results = await response.json()

      // Ajouter les documents au contexte
      const addedDocs = results.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        original_name: doc.original_name,
        name: doc.display_name || doc.original_name || doc.filename,
        file_type: doc.document_type,
        type: doc.mime_type || doc.document_type,
        mime_type: doc.mime_type,
        size_bytes: doc.size_bytes,
        size: doc.size_bytes,
        url: doc.url?.startsWith('/')
          ? `${import.meta.env.VITE_API_URL}${doc.url}`
          : (doc.url || `${import.meta.env.VITE_API_URL}/uploads/${doc.filename}`),
        document_type: doc.document_type,
        status: doc.status,
        numPages: 1,
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }))

      // Mettre à jour le cache
      queryClient.setQueryData(['documents', 'list'], (old) => {
        const currentDocs = old?.documents || []
        return {
          ...old,
          documents: [...currentDocs, ...addedDocs],
          total: (old?.total || 0) + addedDocs.length
        }
      })

      setSelectedDocumentId(addedDocs[0].id)
      setSelectedPageNumber(1)
      toast.success(`${addedDocs.length} document${addedDocs.length > 1 ? 's' : ''} uploadé${addedDocs.length > 1 ? 's' : ''} avec succès !`)
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'upload des documents')
    }
  }

  const handleDeleteBannette = async (bannette) => {
    try {
      await deleteBannette(bannette.id)
      toast.success('Bannette supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleCreateBannette = async (name, description) => {
    try {
      const newBannette = await createBannette(name, [], {}, 0, description)
      toast.success(`Bannette "${name}" créée avec succès !`)
    } catch (error) {
      toast.error('Erreur lors de la création de la bannette')
    }
  }

  const handleCreateDefaultBannette = async () => {
    try {
      await createDefaultBannette()
      toast.success('Bannette par défaut créée avec succès !')
    } catch (error) {
      toast.error('Erreur lors de la création de la bannette par défaut')
    }
  }

  const handleOpenSearchDocument = async (doc) => {
    try {
      const fullDoc = await api.getDocument(doc.id)

      const normalizedDoc = {
        id: fullDoc.id,
        filename: fullDoc.filename,
        original_name: fullDoc.original_name,
        name: fullDoc.display_name || fullDoc.original_name || fullDoc.filename,
        file_type: fullDoc.document_type,
        type: fullDoc.mime_type || fullDoc.document_type,
        mime_type: fullDoc.mime_type,
        size_bytes: fullDoc.size_bytes,
        size: fullDoc.size_bytes,
        url: fullDoc.url?.startsWith('/')
          ? `${import.meta.env.VITE_API_URL}${fullDoc.url}`
          : (fullDoc.url || `${import.meta.env.VITE_API_URL}/uploads/${fullDoc.filename}`),
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
    <>
      <header className="h-10 bg-[#106EBE] flex items-center justify-between px-3 shrink-0 text-white z-50 dark:bg-[#0d4a8e]">
        <div className="flex items-center space-x-3">
          {/* Bouton hamburger visible uniquement sur mobile */}
          <HamburgerButton onClick={onToggleSidebar} isOpen={isSidebarOpen} />

          <DescriptionRounded className="text-[20px]" />
          <span className="font-semibold text-sm hidden xs:inline sm:inline">Kairos WebScan</span>
          <div className="h-4 w-px bg-white/20 mx-2 hidden sm:block"></div>

          {/* Onglets des bannettes */}
          {isAuthenticated && bannettes.length > 0 && (
            <div className="flex items-center space-x-1 bg-white/10 dark:bg-white/10 rounded-lg px-2 py-1 hidden sm:flex">
              {bannettes.slice(0, 3).map((bannette) => (
                <button
                  key={bannette.id}
                  onClick={() => handleLoadBannette(bannette)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors min-w-[80px] truncate ${
                    selectedBannetteId === bannette.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                  title={bannette.name}
                >
                  {bannette.name}
                </button>
              ))}
              {bannettes.length > 3 && (
                <button
                  onClick={() => setShowBannettes(true)}
                  className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors text-white/80"
                  title="Voir toutes les bannettes"
                >
                  <ChevronRightRounded className="text-[16px]" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center space-x-1 hidden sm:flex">
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateBannette(true)}
                className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Créer une bannette"
              >
                <AddRounded className="text-[18px]" />
              </button>
            )}
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['bannettes'] })
                setShowBannettes(true)
              }}
              className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Bannettes"
            >
              <FolderOpenRounded className="text-[18px]" />
            </button>
            <button
              onClick={() => document.getElementById('header-file-input')?.click()}
              className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Importer des documents"
            >
              <UploadFileRounded className="text-[18px]" />
            </button>
            <input
              id="header-file-input"
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files)
                if (files.length > 0) {
                  handleUploadDocuments(files)
                  e.target.value = '' // Reset input
                }
              }}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Barre de recherche - cachée sur très petits écrans, expandable sur mobile */}
          <div className={`flex items-center bg-white/10 rounded px-2 py-1 h-7 transition-all duration-300 ${isSearchExpanded ? 'w-auto' : 'w-32'} hidden xs:flex cursor-pointer`} onClick={() => setShowSearch(true)}>
            <SearchRounded className="text-[16px] mr-2" />
            <span className="text-xs placeholder-white/60">Search...</span>
          </div>
          {/* Bouton de recherche pour très petits écrans */}
          <button
            onClick={() => setShowSearch(true)}
            className="xs:hidden p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <SearchRounded className="text-[18px]" />
          </button>
          {/* Bouton toggle dark mode */}
          <DarkModeToggle />
          {/* User account section */}
          {isAuthenticated ? (
            <AccountMenu />
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm font-medium"
            >
              <LoginRounded className="w-4 h-4" />
              <span className="hidden sm:inline">Se connecter</span>
            </button>
          )}
        </div>
      </header>

      <BannettesModal
        isOpen={showBannettes}
        onClose={() => setShowBannettes(false)}
        bannettes={getAllBannettes()}
        onLoadBannette={handleLoadBannette}
        onDeleteBannette={handleDeleteBannette}
        isDeleting={isLoading}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        goToPage={goToPage}
        prevPage={prevPage}
        nextPage={nextPage}
      />

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onOpenDocument={handleOpenSearchDocument}
      />

      <CreateBannetteModal
        isOpen={showCreateBannette}
        onClose={() => setShowCreateBannette(false)}
        onCreateBannette={handleCreateBannette}
        isCreating={isCreating}
      />
    </>
  )
}

export default Header
