import { useState, Suspense, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMobile } from '../../hooks/useMediaQuery'
import { useOrganizePages } from '../../hooks/useOrganizePages'
import { useClassifiedPages } from '../../hooks/useClassifiedPages'
import TypologyTree from '../ui/TypologyTree'
import PageThumbnail from '../ui/PageThumbnail'
import toast from 'react-hot-toast'

function ClassifyPage() {
  const navigate = useNavigate()
  const isMobile = useMobile()

  // Utiliser nos hooks optimisés avec TanStack Query
  const {
    orderedPages,
    isLoading,
    isWebSocketConnected,
    removePages,
    addPages,
  } = useOrganizePages()

  // DEBUG: Track orderedPages changes
  useEffect(() => {
    console.log('📸 ClassifyPage - orderedPages changed:', orderedPages.length, orderedPages.map(p => p.id))
  }, [orderedPages])

  // États locaux UI seulement
  const [selectedPageIds, setSelectedPageIds] = useState(new Set())
  const [selectedTreeNode, setSelectedTreeNode] = useState(null)
  const [showTypology, setShowTypology] = useState(true)
  const [classifiedPages, setClassifiedPages] = useState({})
  const [viewingNode, setViewingNode] = useState(null)

  const { classifyPages, reinsertPages, deleteInstances } = useClassifiedPages(setClassifiedPages)

  // Toggle sélection
  const togglePageSelection = (pageId) => setSelectedPageIds((prev) => {
    const newSet = new Set(prev)
    if (newSet.has(pageId)) newSet.delete(pageId)
    else newSet.add(pageId)
    return newSet
  })

  // Sélectionner tout
  const toggleSelectAll = () => setSelectedPageIds((prev) =>
    selectedPageIds.size === orderedPages.length ? new Set() : new Set(orderedPages.map((p) => p.id))
  )

  // Classer les pages sélectionnées
  const assignPagesToNode = (node) => {
    if (selectedPageIds.size === 0) {
      toast.error('Veuillez sélectionner au moins une page à classer')
      return
    }

    const pagesToClassify = orderedPages.filter(p => selectedPageIds.has(p.id))
    const nodeName = node.text || node.name || 'Document'

    classifyPages(node.id, nodeName, pagesToClassify)
    removePages(selectedPageIds)
    setSelectedPageIds(new Set())
  }

  // Voir les pages classées
  const handleViewInstance = (instance, nodeId) => setViewingNode({ id: nodeId, isInstance: true, instance, name: instance.name })

  // Réinsérer les pages
  const handleReinsertPages = async (nodeOrInstance) => {
    if (nodeOrInstance.isInstance) {
      const pages = await reinsertPages(nodeOrInstance.id, nodeOrInstance.instance.id)
      if (pages) addPages(pages)
    } else {
      const pages = await reinsertPages(nodeOrInstance.id, null)
      if (pages) addPages(pages)
    }
    if (viewingNode?.id === nodeOrInstance.id) setViewingNode(null)
  }

  // Supprimer instances
  const handleDeleteNode = (nodeOrInstance) => {
    if (nodeOrInstance.isInstance) {
      deleteInstances(nodeOrInstance.id, [nodeOrInstance.instance.id])
    } else {
      deleteInstances(nodeOrInstance.id, null)
    }
    if (viewingNode?.id === nodeOrInstance.id) setViewingNode(null)
  }

  // Mini aperçu des pages non classées
  const PagesPreview = () => (
    <div className="p-3 border-b border-[#edebe9] dark:border-dark-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-[#605e5c] dark:text-dark-text">Pages à classer ({orderedPages.length})</h3>
        <label className="flex items-center space-x-1 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedPageIds.size === orderedPages.length && orderedPages.length > 0}
            onChange={toggleSelectAll}
            className="w-3 h-3 rounded border-2 border-[#c8c6c4] dark:border-dark-borderLight text-[#106EBE] dark:text-blue-500 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Tout</span>
        </label>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
        {orderedPages.slice(0, 16).map((page, index) => (
          <div
            key={page.id}
            onClick={() => togglePageSelection(page.id)}
            className={`relative aspect-[3/4] rounded overflow-hidden cursor-pointer border-2 transition-all ${selectedPageIds.has(page.id)
              ? 'border-[#106EBE] dark:border-blue-400 ring-2 ring-[#106EBE]/20'
              : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE] dark:hover:border-blue-400'
              }`}
          >
            <div className="w-full h-full pointer-events-none">
              <PageThumbnail
                url={page.url}
                pageNumber={page.pageNumber}
                isPdf={page.type === 'application/pdf'}
                isSelected={selectedPageIds.has(page.id)}
              />
            </div>
            {selectedPageIds.has(page.id) && (
              <div className="absolute top-1 right-1 w-3 h-3 bg-[#106EBE] rounded-full flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-white text-[10px]">check</span>
              </div>
            )}
          </div>
        ))}
        {orderedPages.length > 16 && (
          <div className="aspect-[3/4] rounded bg-[#f3f2f1] dark:bg-dark-bgTertiary border-2 border-dashed border-[#c8c6c4] dark:border-dark-borderLight flex items-center justify-center">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">+{orderedPages.length - 16}</span>
          </div>
        )}
      </div>
      {orderedPages.length === 0 && (
        <div className="text-center py-4 text-[#c8c6c4] dark:text-dark-textTertiary text-xs">
          Toutes les pages sont classées
        </div>
      )}
    </div>
  )

  // Afficher le chargement initial
  if (isLoading && orderedPages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#f3f2f1] dark:bg-dark-bg transition-colors duration-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-[#106EBE] dark:text-blue-400 animate-spin mb-4">progress_activity</span>
            <p className="text-lg text-[#605e5c] dark:text-dark-text">Chargement des pages...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1] dark:bg-dark-bg transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bgSecondary border-b border-[#edebe9] dark:border-dark-border p-2 md:p-4 shadow-sm transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-1 md:space-x-2 text-[#605e5c] dark:text-dark-text hover:text-[#106EBE] dark:hover:text-blue-400 transition-colors min-w-[44px] min-h-[44px]">
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium text-xs md:text-sm hidden sm:inline">Retour</span>
            </button>
            <div className="h-6 w-px bg-[#edebe9] dark:bg-dark-border hidden md:block"></div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-[#605e5c] dark:text-dark-text truncate">Classer les pages</h1>
              <p className="text-xs md:text-sm text-[#605e5c] dark:text-dark-text hidden md:block">Sélectionnez des pages et classez-les dans les dossiers</p>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto">
            <span className="text-xs md:text-sm text-[#605e5c] dark:text-dark-text whitespace-nowrap">{orderedPages.length} pg{orderedPages.length > 1 ? 's' : ''}</span>

            {/* Indicateur WebSocket */}
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-[#f3f2f1] dark:bg-dark-bgTertiary" title={isWebSocketConnected ? 'WebSocket connecté - Synchronisation temps réel active' : 'WebSocket déconnecté'}>
              <span className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] text-[#605e5c] dark:text-dark-text hidden md:inline">{isWebSocketConnected ? 'Sync' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Arbre de typologie */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mini aperçu des pages (gauche sur desktop) */}
        <div className={`${isMobile ? 'hidden' : 'w-64'} border-r border-[#edebe9] dark:border-dark-border bg-white dark:bg-dark-bgSecondary`}>
          <PagesPreview />
        </div>

        {/* Zone arbre de typologie */}
        <div className={`${isMobile ? 'w-full' : 'flex-1'} ${isMobile && !showTypology ? 'hidden' : ''}`}>
          {isMobile && (
            <div className="p-2 bg-[#faf9f8] dark:bg-dark-bgSecondary border-b border-[#edebe9] dark:border-dark-border flex items-center justify-between transition-colors duration-200">
              <span className="text-xs font-semibold text-[#605e5c] dark:text-dark-text">Pages à classer</span>
            </div>
          )}
          {isMobile && <PagesPreview />}
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center p-4">
              <span className="material-symbols-outlined text-3xl text-[#106EBE] dark:text-blue-400 animate-spin">progress_activity</span>
            </div>
          }>
            <TypologyTree
              onNodeSelect={setSelectedTreeNode}
              onAssignPages={assignPagesToNode}
              selectedNode={selectedTreeNode}
              classifiedPages={classifiedPages}
              onViewPages={handleViewInstance}
              onReinsertPages={handleReinsertPages}
              onDeleteNode={handleDeleteNode}
            />
          </Suspense>
        </div>
      </div>

      {/* Modal des pages classées */}
      {viewingNode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setViewingNode(null)}>
          <div className="bg-white dark:bg-dark-bgSecondary rounded-lg p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">{viewingNode.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {viewingNode.instance ? `${viewingNode.instance.pages.length} pages` : 'Visualisation à implémenter'}
            </p>
            <button onClick={() => setViewingNode(null)} className="bg-[#106EBE] dark:bg-blue-600 text-white px-4 py-2 rounded">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassifyPage
