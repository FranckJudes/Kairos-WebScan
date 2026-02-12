import { useState } from 'react'
import { HamburgerButton } from '../ui/MobileSidebar'
import DarkModeToggle from '../ui/DarkModeToggle'
import { useDarkMode } from '../../hooks/useDarkMode'
import { useBannettes } from '../../hooks/useBannettes'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import toast from 'react-hot-toast'

function BannettesModal({ isOpen, onClose, bannettes, onLoadBannette, onDeleteBannette, isDeleting }) {
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
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Table des bannettes */}
        <div className="flex-1 overflow-auto p-4">
          {bannettes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-[50px] text-[#c8c6c4] dark:text-dark-textTertiary mb-3">folder_open</span>
              <p className="text-sm text-[#605e5c] dark:text-dark-text">
                Aucune bannette sauvegardée
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f3f2f1] dark:bg-dark-bgTertiary border-b-2 border-[#edebe9] dark:border-dark-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider border-r border-[#edebe9] dark:border-dark-border">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider border-r border-[#edebe9] dark:border-dark-border">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider border-r border-[#edebe9] dark:border-dark-border">Pages</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider border-r border-[#edebe9] dark:border-dark-border">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bgSecondary divide-y divide-[#edebe9] dark:divide-dark-border">
                  {bannettes.map((bannette) => (
                    <tr key={bannette.id} className="hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors border-b border-[#edebe9] dark:border-dark-border last:border-b-0">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="material-symbols-outlined text-[20px] text-[#106EBE] dark:text-blue-400">folder</span>
                          <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text truncate max-w-[200px]">
                            {bannette.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary truncate max-w-[250px]">
                          {bannette.description || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-[#605e5c] dark:text-dark-text">
                          {bannette.total_pages} page{bannette.total_pages > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-[#605e5c] dark:text-dark-text">
                          {formatDate(bannette.updated_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onLoadBannette(bannette)}
                            className="p-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded transition-colors"
                            title="Charger"
                          >
                            <span className="material-symbols-outlined text-[18px]">folder_open</span>
                          </button>
                          <button
                            onClick={() => onDeleteBannette(bannette)}
                            disabled={isDeleting}
                            className="p-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white rounded transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
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
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
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

function Header({ onToggleSidebar, isSidebarOpen }) {
  const [showBannettes, setShowBannettes] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const { isDarkMode } = useDarkMode()
  const {
    bannettes,
    total,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    isLoading,
    deleteBannette,
    loadBannette
  } = useBannettes()
  const navigate = useNavigate()
  const { setOrderedPages, setClassifiedPages } = useDocuments()

  const handleLoadBannette = async (bannette) => {
    try {
      const data = await loadBannette(bannette.id)

      // Restaurer les pages ordonnées
      if (data.pages_order && data.pages_order.length > 0) {
        setOrderedPages(data.pages_order)
      }

      // Restaurer les pages classées
      if (data.classified_pages) {
        setClassifiedPages(data.classified_pages)
      }

      setShowBannettes(false)
      // Notification
      toast.success(`Bannette "${bannette.name}" chargée avec succès !`)
    } catch (error) {
      console.error('Erreur chargement bannette:', error)
      toast.error('Erreur lors du chargement de la bannette')
    }
  }

  const handleDeleteBannette = async (bannette) => {
    try {
      await deleteBannette(bannette.id)
      toast.success('Bannette supprimée')
    } catch (error) {
      console.error('Erreur suppression bannette:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  return (
    <>
      <header className="h-10 bg-[#106EBE] flex items-center justify-between px-3 shrink-0 text-white z-50 dark:bg-[#0d4a8e]">
        <div className="flex items-center space-x-3">
          {/* Bouton hamburger visible uniquement sur mobile */}
          <HamburgerButton onClick={onToggleSidebar} isOpen={isSidebarOpen} />

          <span className="material-symbols-outlined text-[20px]">description</span>
          <span className="font-semibold text-sm hidden xs:inline sm:inline">Kairos WebScan</span>
          <div className="h-4 w-px bg-white/20 mx-2 hidden sm:block"></div>
          <div className="flex items-center space-x-1 hidden sm:flex">
            <button
              onClick={() => setShowBannettes(true)}
              className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Bannettes"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Barre de recherche - cachée sur très petits écrans, expandable sur mobile */}
          <div className={`flex items-center bg-white/10 rounded px-2 py-1 h-7 transition-all duration-300 ${isSearchExpanded ? 'w-auto' : 'w-32'} hidden xs:flex`}>
            <span className="material-symbols-outlined text-[16px] mr-2">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-xs p-0 w-20 xs:w-24 sm:w-40 placeholder-white/60"
              placeholder="Search..."
              type="text"
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => setIsSearchExpanded(false)}
            />
          </div>
          {/* Bouton de recherche pour très petits écrans */}
          <button className="xs:hidden p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </button>
          {/* Bouton toggle dark mode */}
          <DarkModeToggle />
          {/* User avatar avec taille responsive */}
          <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-white/20 overflow-hidden border border-white/30">
            <img
              alt="User"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl3E7htN3y7W1dQg533vblGrq_JbzH3MEU6f2LWX2-Gvfw-dFDzNCbxXucuiifw75esq6EjY6QbpA4qVgQOqzHVC6pD6AgRpnpmkmBYO52JuHIcjSQro9yWbH4yejREHxLrVqvgMMfnN7jiqx9MDFlFuC_llAVQwDLbi4wSwf-cK3LCdGfCbHVE4hpiio7sHHkGC59HYdKcS9PltSWguWqd61efj_gaTdwMQE3BSjdinZpdbyoDVbGI4ILSwRvMVvSz-i386qZsZLx"
            />
          </div>
        </div>
      </header>

      <BannettesModal
        isOpen={showBannettes}
        onClose={() => setShowBannettes(false)}
        bannettes={bannettes}
        onLoadBannette={handleLoadBannette}
        onDeleteBannette={handleDeleteBannette}
        isDeleting={isLoading}
      />
    </>
  )
}

export default Header
