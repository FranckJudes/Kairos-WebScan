import { useDocuments } from '../../contexts/DocumentsContext'
import FileDropZone from '../ui/FileDropZone'
import DraggablePageThumbnail from '../ui/DraggablePageThumbnail'
import MobileSidebar from '../ui/MobileSidebar'
import { useSidebar } from '../ui/Layout'
import { useMobile } from '../../hooks/useMediaQuery'
import { usePageSelectionAfterDeletion } from '../../hooks/usePageSelectionAfterDeletion'
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
import toast from 'react-hot-toast'
import {
  FolderOpenRounded,
  DeleteRounded,
  AddRounded,
  CloudUploadRounded
} from '@mui/icons-material'

function Sidebar() {
  const {
    documents,
    allPages,
    selectedPageId,
    addDocuments,
    selectPageById,
    setDocuments,
    selectedDocumentId,
    setSelectedDocumentId,
    setSelectedPageNumber
  } = useDocuments()

  const { isSidebarOpen, closeSidebar } = useSidebar()
  const isMobile = useMobile()

  const [pagesOrder, setPagesOrder] = useState([])
  const [selectedPageIds, setSelectedPageIds] = useState(new Set())

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addDocuments(files)
  }

  // Toggle checkbox selection
  const togglePageSelection = (pageId) => {
    setSelectedPageIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pageId)) {
        newSet.delete(pageId)
      } else {
        newSet.add(pageId)
      }
      return newSet
    })
  }

  // Select/deselect all pages
  const toggleSelectAll = () => {
    if (selectedPageIds.size === allPages.length) {
      setSelectedPageIds(new Set())
    } else {
      setSelectedPageIds(new Set(allPages.map(p => p.id)))
    }
  }

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Delete selected pages
  const handleDeleteSelected = () => {
    if (selectedPageIds.size === 0) return
    const pagesByDocument = {}
    const documentsWithAllPagesDeleted = []

    selectedPageIds.forEach(pageId => {
      const page = allPages.find(p => p.id === pageId)
      if (page) {
        if (!pagesByDocument[page.documentId]) {
          pagesByDocument[page.documentId] = []
        }
        // Store the originalPageNumber to identify the page (doesn't change after deletions)
        pagesByDocument[page.documentId].push(page.originalPageNumber)
      }
    })


    Object.keys(pagesByDocument).forEach(docId => {
      const doc = documents.find(d => d.id === parseInt(docId))
      if (doc) {
        const totalDocPages = doc.pages?.length || doc.numPages || 1
        const pagesToDelete = pagesByDocument[docId].length
        if (totalDocPages === pagesToDelete) {
          documentsWithAllPagesDeleted.push(parseInt(docId))
        }
      }
    })


    setDocuments(prevDocs => {
      return prevDocs.map(doc => {
        const originalPageNumbersToRemove = pagesByDocument[doc.id]
        if (!originalPageNumbersToRemove || originalPageNumbersToRemove.length === 0) return doc

        const existingPages = doc.pages || Array.from({ length: doc.numPages || 1 }, (_, i) => ({
          pageNumber: i + 1,
          url: doc.url,
          originalPageNumber: i + 1
        }))

        const filteredPages = existingPages.filter(page => !originalPageNumbersToRemove.includes(page.originalPageNumber))

        if (filteredPages.length === 0) {
          return null
        }

        return {
          ...doc,
          pages: filteredPages.map((page, index) => {
            let pageUrl = page.url
            if (pageUrl && pageUrl.startsWith('/')) {
              pageUrl = `${API_BASE_URL}${pageUrl}`
            }

            return {
              ...page,
              url: pageUrl,
              pageNumber: index + 1,
              originalPageNumber: page.originalPageNumber  // Keep original stable
            }
          }),
          numPages: filteredPages.length
        }
      }).filter(Boolean)
    })

    setSelectedPageIds(new Set())

    toast.success(`${selectedPageIds.size} page(s) supprimée(s)`)
  }

  useEffect(() => {
    const order = allPages.map(page => page.id)
    setPagesOrder(order)
  }, [documents])

  usePageSelectionAfterDeletion(
    allPages,
    selectedPageId,
    selectedDocumentId,
    selectPageById,
    setSelectedDocumentId,
    setSelectedPageNumber
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
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
      setPagesOrder(arrayMove(pagesOrder, oldIndex, newIndex))
    }
  }

  const orderedPages = pagesOrder
    .map(id => allPages.find(page => page.id === id))
    .filter(Boolean)

  const totalPages = allPages.length

  const sidebarContent = (
    <aside className="w-48 md:w-52 h-full border-r border-[#edebe9] dark:border-dark-border bg-white dark:bg-dark-bg flex flex-col shrink-0 transition-colors duration-200">
      <div className="p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {totalPages > 0 && (
              <input
                type="checkbox"
                checked={selectedPageIds.size === totalPages && totalPages > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-[#106EBE] focus:ring-[#106EBE]"
              />
            )}
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#605e5c] dark:text-dark-text flex items-center">
              <FolderOpenRounded className="text-[16px] mr-2" />
              Pages
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            {selectedPageIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="hover:bg-[#e1dfdd] dark:hover:bg-dark-hover p-1 rounded transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title={`Supprimer ${selectedPageIds.size} page(s)`}
              >
                <DeleteRounded className="text-[18px] text-red-600 dark:text-red-400" />
              </button>
            )}
            <label className="cursor-pointer hover:bg-[#e1dfdd] dark:hover:bg-dark-hover p-1 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Add document">
              <AddRounded className="text-[18px] text-[#106EBE] dark:text-blue-400" />
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
                multiple
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>
        {totalPages > 0 && (
          <p className="text-[10px] text-[#605e5c] dark:text-dark-textTertiary">
            {selectedPageIds.size > 0 ? `${selectedPageIds.size} sélectionnée(s)` : `${totalPages} ${totalPages === 1 ? 'page' : 'pages'} • ${documents.length} ${documents.length === 1 ? 'document' : 'documents'}`}
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
                <CloudUploadRounded className="text-[#c8c6c4] dark:text-dark-textTertiary text-4xl mb-2 group-hover:text-[#106EBE] dark:group-hover:text-blue-400 transition-colors" />
                <p className="text-[10px] font-medium text-[#c8c6c4] dark:text-dark-textTertiary group-hover:text-[#106EBE] dark:group-hover:text-blue-400 transition-colors">DROP FILES HERE</p>
                <p className="text-[9px] text-[#c8c6c4] dark:text-dark-textTertiary mt-2">or click to browse</p>
              </div>
            </FileDropZone>
          </div>
        ) : (
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
                <div className="space-y-3 px-3 py-3">
                  {orderedPages.map((page) => {
                    const isPdfPage = page.url && page.url.toLowerCase().endsWith('.pdf')

                    return (
                      <div key={page.id} className="relative">
                        <DraggablePageThumbnail
                          id={page.id}
                          url={page.url}
                          pageNumber={page.pageNumber}
                          isSelected={selectedPageId === page.id}
                          isCheckboxSelected={selectedPageIds.has(page.id)}
                          onCheckboxToggle={() => togglePageSelection(page.id)}
                          onClick={() => {
                            selectPageById(page.id)
                            if (isMobile) closeSidebar()
                          }}
                          isPdf={isPdfPage}
                          disabled={isMobile}
                        />
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

  return (
    <MobileSidebar isOpen={isSidebarOpen} onClose={closeSidebar}>
      {sidebarContent}
    </MobileSidebar>
  )
}

export default Sidebar
