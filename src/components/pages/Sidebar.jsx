import { useDocuments } from '../../contexts/DocumentsContext'
import FileDropZone from '../ui/FileDropZone'
import DraggablePageThumbnail from '../ui/DraggablePageThumbnail'
import MobileSidebar from '../ui/MobileSidebar'
import { useSidebar } from '../ui/Layout'
import { useMobile } from '../../hooks/useMediaQuery'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useState, useEffect } from 'react'

function Sidebar() {
  const {
    documents,
    allPages,
    selectedPageId,
    addDocuments,
    selectPageById
  } = useDocuments()

  const { isSidebarOpen, closeSidebar } = useSidebar()
  const isMobile = useMobile()

  // État local pour l'ordre des pages (pour le drag and drop)
  const [pagesOrder, setPagesOrder] = useState([])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addDocuments(files)
  }

  // Mettre à jour l'ordre local quand les données changent
  useEffect(() => {
    const order = allPages.map(page => page.id)
    setPagesOrder(order)
  }, [documents])

  // Capteurs pour le drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de mouvement avant d'activer le drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = pagesOrder.indexOf(active.id)
      const newIndex = pagesOrder.indexOf(over.id)

      // Mettre à jour l'ordre local (visuel uniquement pour l'instant)
      setPagesOrder(arrayMove(pagesOrder, oldIndex, newIndex))

      // TODO: Implémenter la réorganisation réelle entre documents
      console.log('Drag from', oldIndex, 'to', newIndex)
    }
  }

  // Utiliser l'ordre local pour afficher les pages
  const orderedPages = pagesOrder
    .map(id => allPages.find(page => page.id === id))
    .filter(Boolean)

  const totalPages = allPages.length

  const sidebarContent = (
    <aside className="w-48 md:w-52 h-full border-r border-[#edebe9] dark:border-dark-border bg-white dark:bg-dark-bg flex flex-col shrink-0 transition-colors duration-200">
      {/* Header avec bouton d'ajout */}
      <div className="p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#605e5c] dark:text-dark-text flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-2">folder_open</span>
            Pages
          </h2>
          <label className="cursor-pointer hover:bg-[#e1dfdd] dark:hover:bg-dark-hover p-1 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Add document">
            <span className="material-symbols-outlined text-[18px] text-[#106EBE] dark:text-blue-400">add</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
              multiple
              onChange={handleFileSelect}
            />
          </label>
        </div>
        {totalPages > 0 && (
          <p className="text-[10px] text-[#605e5c] dark:text-dark-textTertiary mt-2">
            {totalPages} {totalPages === 1 ? 'page' : 'pages'} • {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </p>
        )}
      </div>

      {/* Pages List */}
      <div className="flex-1 flex flex-col min-h-0">
        {totalPages === 0 ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <FileDropZone
              onDrop={addDocuments}
              className="cursor-pointer group"
            >
              <div className="border-2 border-dashed border-[#c8c6c4] dark:border-dark-borderLight rounded-lg p-8 text-center hover:border-[#106EBE] hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-all">
                <span className="material-symbols-outlined text-[#c8c6c4] dark:text-dark-textTertiary text-4xl mb-2 group-hover:text-[#106EBE] dark:group-hover:text-blue-400 transition-colors">cloud_upload</span>
                <p className="text-[10px] font-medium text-[#c8c6c4] dark:text-dark-textTertiary group-hover:text-[#106EBE] dark:group-hover:text-blue-400 transition-colors">DROP FILES HERE</p>
                <p className="text-[9px] text-[#c8c6c4] dark:text-dark-textTertiary mt-2">or click to browse</p>
              </div>
            </FileDropZone>
          </div>
        ) : (
          /* Liste des pages avec Drag and Drop */
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pagesOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 px-3 py-3">
                  {orderedPages.map((page) => {
                    // Détecter si c'est un PDF en vérifiant l'extension
                    const isPdfPage = page.url && page.url.toLowerCase().endsWith('.pdf')

                    return (
                      <div key={page.id} className="relative">
                        <DraggablePageThumbnail
                          id={page.id}
                          url={page.url}
                          pageNumber={page.pageNumber}
                          isSelected={selectedPageId === page.id}
                          onClick={() => {
                            selectPageById(page.id)
                            if (isMobile) closeSidebar()
                          }}
                          isPdf={isPdfPage}
                          disabled={isMobile}
                        />
                        {/* Nom du document en petit */}
                        <p className="text-[9px] text-[#605e5c] dark:text-dark-textTertiary truncate mt-1 px-1" title={page.documentName}>
                          {page.documentName}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </aside>
  )

  // Utiliser MobileSidebar wrapper pour la gestion mobile/desktop
  return (
    <MobileSidebar isOpen={isSidebarOpen} onClose={closeSidebar}>
      {sidebarContent}
    </MobileSidebar>
  )
}

export default Sidebar
