import { useState, useMemo, useEffect, useRef, useTransition, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import { Document, Page, pdfjs } from 'react-pdf'
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TypologyTree from '../ui/TypologyTree'
import { useMobile } from '../../hooks/useMediaQuery'
import { useVirtualizer } from '@tanstack/react-virtual'

// Configuration de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Composant Modal pour visualiser une page en grand
function PageModal({ page, onClose }) {
  const [scale, setScale] = useState(1)
  const isMobile = useMobile()

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setScale(1)

  const isPdf = page.type === 'application/pdf' && !page.url.includes('/api/WiaScanner/image')

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] md:max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du modal */}
        <div className="bg-white dark:bg-dark-bgSecondary rounded-t-lg p-2 md:p-3 flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-2 transition-colors duration-200">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            <h3 className="text-xs md:text-sm font-semibold text-[#605e5c] dark:text-dark-text truncate">{page.documentName}</h3>
            <span className="text-[9px] md:text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary bg-[#f3f2f1] dark:bg-dark-bgTertiary px-2 py-0.5 rounded-full whitespace-nowrap">
              Pg {page.pageNumber}
            </span>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-1 md:gap-2 overflow-x-auto">
            {isPdf && (
              <>
                <button onClick={zoomOut} disabled={scale <= 0.5} className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center" title="Zoom arrière">
                  <span className="material-symbols-outlined text-[20px] md:text-[18px]">zoom_out</span>
                </button>
                <span className="text-[10px] text-[#605e5c] dark:text-dark-text min-w-[40px] md:min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} disabled={scale >= 3} className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center" title="Zoom avant">
                  <span className="material-symbols-outlined text-[20px] md:text-[18px]">zoom_in</span>
                </button>
                <button onClick={resetZoom} className="px-2 md:px-2 py-1 md:py-0.5 text-[10px] bg-white dark:bg-dark-bg border border-[#edebe9] dark:border-dark-border rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover min-w-[44px] min-h-[44px] flex items-center justify-center">
                  Reset
                </button>
              </>
            )}
            <button onClick={onClose} className="ml-0 md:ml-2 p-1.5 md:p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Fermer">
              <span className="material-symbols-outlined text-[20px] md:text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Contenu du modal */}
        <div className="bg-gray-100 dark:bg-dark-bg rounded-b-lg p-2 md:p-4 overflow-auto flex items-center justify-center" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {isPdf ? (
            <Document file={page.url} loading={<div className="flex items-center justify-center"><span className="material-symbols-outlined text-4xl text-gray-400 dark:text-dark-textTertiary animate-spin">progress_activity</span></div>}>
              <Page pageNumber={page.pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          ) : (
            <img src={page.url} alt={`${page.documentName} - Page ${page.pageNumber}`} className="max-w-full max-h-full object-contain" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }} />
          )}
        </div>
      </div>
    </div>
  )
}

// Composant pour afficher la miniature d'une page PDF
function PDFThumbnail({ url, pageNumber }) {
  const [numPages, setNumPages] = useState(null)

  const onLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#f3f2f1]">
      <Document file={url} onLoadSuccess={onLoadSuccess} loading={<div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-2xl text-gray-400 animate-spin">progress_activity</span></div>}>
        <Page pageNumber={pageNumber} width={150} renderTextLayer={false} renderAnnotationLayer={false} className="flex items-center justify-center" />
      </Document>
    </div>
  )
}

// Composant SortablePage pour une page avec drag & drop
function SortablePage({ page, index, removePage, rotatePage, onClick, isSelected, onToggleSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })

  const [rotation, setRotation] = useState(0)

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    rotatePage(page.id, newRotation)
  }

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={`relative bg-white dark:bg-dark-bgSecondary rounded-lg shadow-sm border-2 transition-all group ${isDragging ? 'border-[#106EBE] dark:border-blue-400 opacity-50 scale-95 z-50' : isSelected ? 'border-[#106EBE] dark:border-blue-400 ring-2 ring-[#106EBE]/20 dark:ring-blue-400/20' : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE] dark:hover:border-blue-400 hover:shadow-md'}`}>
      {/* Case à cocher */}
      <div className="absolute top-2 left-2 z-20 pointer-events-auto">
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(page.id)} className="w-5 h-5 rounded border-2 border-[#c8c6c4] dark:border-dark-borderLight text-[#106EBE] dark:text-blue-500 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:ring-2 cursor-pointer" />
      </div>

      {/* Numéro d'ordre */}
      <div className={`absolute top-2 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10 pointer-events-none ${isSelected ? 'bg-[#106EBE] dark:bg-blue-500 w-7 h-7 left-9' : 'bg-black/50 dark:bg-white/30 px-1.5 left-10'}`}>
        {index + 1}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <button onClick={handleRotate} className="bg-[#f3f2f1] dark:bg-dark-bgTertiary hover:bg-[#106EBE] dark:hover:bg-blue-500 hover:text-white text-[#605e5c] dark:text-dark-text p-1.5 rounded shadow-sm transition-colors" title="Rotation 90°">
          <span className="material-symbols-outlined text-[14px]">rotate_right</span>
        </button>
        <button onClick={() => removePage(page.id)} className="bg-red-100 dark:bg-red-900/30 hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white p-1.5 rounded shadow-sm transition-colors" title="Supprimer">
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>

      {/* Card Content */}
      <div className="p-3">
        {/* Thumbnail */}
        <div className="aspect-[3/4] bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg mb-2 overflow-hidden relative cursor-pointer hover:bg-[#e1dfdd] dark:hover:bg-dark-hover transition-colors" onClick={onClick}>
          {page.type === 'application/pdf' && !page.url.includes('/api/WiaScanner/image') ? (
            <PDFThumbnail url={page.url} pageNumber={page.pageNumber} />
          ) : (
            <img src={page.url} alt={page.documentName} className="w-full h-full object-cover transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }} />
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="material-symbols-outlined text-white dark:text-dark-text text-3xl drop-shadow-lg">zoom_in</span>
          </div>
        </div>

        {/* Document Info */}
        <div className="space-y-1 pointer-events-none">
          <h3 className="text-[10px] font-medium text-[#605e5c] dark:text-dark-text truncate" title={page.documentName}>{page.documentName}</h3>
          <div className="flex items-center justify-between text-[9px] text-[#c8c6c4] dark:text-dark-textTertiary">
            <span>Page {page.pageNumber}</span>
            <span>{(page.size / 1024).toFixed(0)} KB</span>
          </div>
        </div>
      </div>

      {/* Drag Handle */}
      <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-white dark:bg-dark-bgSecondary rounded-l shadow-md p-1" {...attributes} {...listeners}>
        <span className="material-symbols-outlined text-[#605e5c] dark:text-dark-text text-xl">drag_indicator</span>
      </div>
    </div>
  )
}

// Composant PageViewer simple (sans barre d'outils)
function PageViewer({ page, index, isSelected, onSelectInstance, zoom, rotation }) {
  const isPdf = page.type === 'application/pdf' && !page.url.includes('/api/WiaScanner/image')

  return (
    <div className={`bg-white dark:bg-dark-bgSecondary rounded-lg shadow-md overflow-hidden transition-all ${isSelected ? 'ring-2 ring-[#106EBE] dark:ring-blue-400 ring-offset-2 dark:ring-offset-dark-bg' : ''}`}>
      {/* Header simple */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#faf9f8] dark:bg-dark-bg border-b border-[#edebe9] dark:border-dark-border">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectInstance(page.instanceId)}
            className="w-4 h-4 rounded border-2 border-[#c8c6c4] dark:border-dark-borderLight text-[#106EBE] dark:text-blue-500 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
          <span className="text-xs font-semibold text-[#605e5c] dark:text-dark-text">Page {index + 1}</span>
          <span className="text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary bg-[#f3f2f1] dark:bg-dark-bgTertiary px-2 py-0.5 rounded">{page.instanceName}</span>
          <span className="text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary">• {page.documentName}</span>
        </div>
        <span className="text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary">{(page.size / 1024).toFixed(0)} KB</span>
      </div>

      {/* Contenu de la page */}
      <div className="p-4 bg-[#f3f2f1] dark:bg-dark-bg">
        <div
          className="mx-auto transition-transform duration-300"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
        >
          {isPdf ? (
            <Document file={page.url} loading={<div className="flex items-center justify-center py-8"><span className="material-symbols-outlined text-3xl text-gray-400 dark:text-dark-textTertiary animate-spin">progress_activity</span></div>}>
              <Page
                pageNumber={page.pageNumber}
                scale={zoom}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          ) : (
            <img
              src={page.url}
              alt={`${page.documentName} - Page ${page.pageNumber}`}
              className="max-w-full h-auto mx-auto shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Composant Modal pour voir les pages classées - Mode Lecteur PDF avec barre d'outils globale
function ClassifiedPagesModal({ node, instancesData, onClose, onReinsert, onDeleteInstances }) {
  const [selectedInstanceIds, setSelectedInstanceIds] = useState(new Set())
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const isMobile = useMobile()

  // Aplatir toutes les pages de toutes les instances
  const { allPages, totalInstances, totalPages } = useMemo(() => {
    const pages = []
    let instanceCount = 0
    let pageCount = 0

    Object.values(instancesData).forEach(instances => {
      instances.forEach(instance => {
        instanceCount++
        instance.pages.forEach(page => {
          pageCount++
          pages.push({ ...page, instanceName: instance.name, instanceId: instance.id })
        })
      })
    })

    return { allPages: pages, totalInstances: instanceCount, totalPages: pageCount }
  }, [instancesData])

  const currentPage = allPages[currentPageIndex]

  // Actions
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handlePrevPage = () => setCurrentPageIndex(prev => Math.max(0, prev - 1))
  const handleNextPage = () => setCurrentPageIndex(prev => Math.min(allPages.length - 1, prev + 1))

  const toggleSelectInstance = (instanceId) => {
    setSelectedInstanceIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(instanceId)) {
        newSet.delete(instanceId)
      } else {
        newSet.add(instanceId)
      }
      return newSet
    })
  }

  const toggleSelectAllInstances = () => {
    const allInstanceIds = []
    Object.values(instancesData).forEach(instances => {
      instances.forEach(instance => {
        allInstanceIds.push(instance.id)
      })
    })

    setSelectedInstanceIds(prev =>
      prev.size === allInstanceIds.length ? new Set() : new Set(allInstanceIds)
    )
  }

  const handleReinsertAll = () => {
    const allInstances = []
    Object.values(instancesData).forEach(instances => {
      allInstances.push(...instances)
    })
    onReinsert(allInstances)
  }

  const handleDeleteCurrentPage = () => {
    if (confirm(`Supprimer cette page de "${currentPage.instanceName}" ?`)) {
      // Supprimer la page de l'instance
      const instance = instancesData[currentPage.instanceName]?.find(i => i.id === currentPage.instanceId)
      if (instance) {
        onDeleteInstances([instance])
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 md:p-4" onClick={onClose}>
      <div className="relative w-[95vw] md:w-[90vw] max-w-5xl max-h-[90vh] bg-white dark:bg-dark-bgSecondary rounded-lg shadow-2xl flex flex-col transition-colors duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bg rounded-t-lg flex-shrink-0 transition-colors duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
              <span className="material-symbols-outlined text-[20px] md:text-[24px] text-[#106EBE] dark:text-blue-400 shrink-0">folder_special</span>
              <div className="min-w-0">
                <h3 className="text-base md:text-lg font-semibold text-[#605e5c] dark:text-dark-text truncate">{node.name}</h3>
                <p className="text-xs md:text-sm text-[#c8c6c4] dark:text-dark-textTertiary">{totalPages} pg{totalPages > 1 ? 's' : ''} • {totalInstances} inst.{totalInstances > 1 ? 's' : ''}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Barre d'outils GLOBALE */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-2 md:px-3 py-2 bg-white dark:bg-dark-bg border border-[#edebe9] dark:border-dark-border rounded transition-colors duration-200">
            <div className="flex items-center justify-between lg:justify-start gap-1 overflow-x-auto">
              {/* Navigation entre pages */}
              <button
                onClick={handlePrevPage}
                disabled={currentPageIndex === 0}
                className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Page précédente"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[20px]">chevron_left</span>
              </button>
              <span className="text-xs text-[#605e5c] dark:text-dark-text min-w-[50px] md:min-w-[60px] text-center">
                {allPages.length > 0 ? `${currentPageIndex + 1}/${allPages.length}` : '-/-'}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPageIndex >= allPages.length - 1}
                className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Page suivante"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[20px]">chevron_right</span>
              </button>

              {/* Séparateur */}
              <div className="h-6 w-px bg-[#edebe9] dark:bg-dark-border hidden lg:block"></div>

              {/* Zoom - caché sur très petits écrans si nécessaire */}
              <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center" title="Zoom arrière">
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">zoom_out</span>
              </button>
              <span className="text-[10px] text-[#605e5c] dark:text-dark-text min-w-[35px] md:min-w-[45px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} disabled={zoom >= 3} className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center" title="Zoom avant">
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">zoom_in</span>
              </button>
              <button onClick={handleResetZoom} className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover min-w-[44px] min-h-[44px] flex items-center justify-center" title="Reset zoom">
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">restart</span>
              </button>

              {/* Rotation */}
              <button onClick={handleRotate} className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover min-w-[44px] min-h-[44px] flex items-center justify-center" title="Rotation 90°">
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">rotate_right</span>
              </button>

              {/* Séparateur */}
              <div className="h-6 w-px bg-[#edebe9] dark:bg-dark-border hidden lg:block"></div>

              {/* Supprimer la page courante */}
              <button
                onClick={handleDeleteCurrentPage}
                className="p-1.5 md:p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="Supprimer cette page"
              >
                <span className="material-symbols-outlined text-[20px] md:text-[18px]">delete</span>
              </button>
            </div>

            {/* Actions de sélection et globales */}
            <div className="flex items-center justify-between lg:justify-end gap-2 overflow-x-auto">
              <label className="flex items-center space-x-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={selectedInstanceIds.size === totalInstances && totalInstances > 0}
                  onChange={toggleSelectAllInstances}
                  className="w-4 h-4 md:w-4 md:h-4 rounded border-2 border-[#c8c6c4] dark:border-dark-borderLight text-[#106EBE] dark:text-blue-500 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-xs text-[#605e5c] dark:text-dark-text whitespace-nowrap">{selectedInstanceIds.size > 0 ? `${selectedInstanceIds.size} sel.` : 'Tout'}</span>
              </label>

              {selectedInstanceIds.size > 0 && (
                <button
                  onClick={() => {
                    const instancesToDelete = []
                    Object.values(instancesData).forEach(instances => {
                      instances.forEach(instance => {
                        if (selectedInstanceIds.has(instance.id)) {
                          instancesToDelete.push(instance)
                        }
                      })
                    })
                    if (confirm(`Supprimer ${selectedInstanceIds.size} instance(s) ?`)) {
                      onDeleteInstances(instancesToDelete)
                      setSelectedInstanceIds(new Set())
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white px-2 md:px-3 py-1.5 rounded shadow flex items-center space-x-1 text-xs transition-colors shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span className="hidden sm:inline">Supprimer ({selectedInstanceIds.size})</span>
                </button>
              )}

              <button
                onClick={handleReinsertAll}
                className="bg-[#107c10] hover:bg-[#0d5c0d] dark:bg-green-700 dark:hover:bg-green-600 text-white px-2 md:px-3 py-1.5 rounded shadow flex items-center space-x-1 text-xs transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">restore</span>
                <span className="hidden sm:inline">Réinsérer tout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu - Pages en lecteur PDF scrollable */}
        <div className="flex-1 overflow-auto p-3 md:p-6 bg-gray-100 dark:bg-dark-bg transition-colors duration-200">
          {allPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-[60px] text-[#c8c6c4] dark:text-dark-textTertiary mb-4">folder_open</span>
              <p className="text-sm text-[#605e5c] dark:text-dark-text">Ce dossier ne contient aucune page</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPages.map((page, index) => (
                <PageViewer
                  key={page.id}
                  page={page}
                  index={index}
                  isSelected={selectedInstanceIds.has(page.instanceId)}
                  onSelectInstance={toggleSelectInstance}
                  zoom={index === currentPageIndex ? zoom : 1}
                  rotation={index === currentPageIndex ? rotation : 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant de grille virtualisée avec TanStack Virtual
function GridVirtualizer({ parentRef, orderedPages, columnsCount, removePage, rotatePage, setSelectedPage, selectedPageIds, togglePageSelection }) {
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(orderedPages.length / columnsCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Hauteur estimée d'une ligne (vignette + espacement)
    overscan: 3,
  })

  const getRowPages = (rowIndex) => {
    const start = rowIndex * columnsCount
    const end = Math.min(start + columnsCount, orderedPages.length)
    return orderedPages.slice(start, end)
  }

  return (
    <div
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const rowPages = getRowPages(virtualRow.index)

        return (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3 md:gap-4 px-0.5">
              {rowPages.map((page) => {
                const index = orderedPages.findIndex(p => p.id === page.id)
                return (
                  <SortablePage
                    key={page.id}
                    page={page}
                    index={index}
                    removePage={removePage}
                    rotatePage={rotatePage}
                    onClick={() => setSelectedPage(page)}
                    isSelected={selectedPageIds.has(page.id)}
                    onToggleSelect={togglePageSelection}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OrganizePage() {
  const navigate = useNavigate()
  const { documents } = useDocuments()
  const isMobile = useMobile()
  const [isPending, startTransition] = useTransition()

  // États
  const [selectedPage, setSelectedPage] = useState(null)
  const [selectedPageIds, setSelectedPageIds] = useState(new Set())
  const [selectedTreeNode, setSelectedTreeNode] = useState(null)
  const [classifiedPages, setClassifiedPages] = useState({}) // { nodeId: { documentName: [instances] } }
  const [viewingNode, setViewingNode] = useState(null) // Nœud en cours de visualisation
  const [showTypology, setShowTypology] = useState(false) // Contrôle l'affichage de l'arbre sur mobile
  const [isInitialLoad, setIsInitialLoad] = useState(true) // État pour le premier chargement

  // Effet pour marquer la fin du chargement initial
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
    }, 100) // Délai court pour laisser le rendu initial se faire
    return () => clearTimeout(timer)
  }, [])

  // Capteurs pour le drag & drop
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  // Référence pour le conteneur de scroll (utilisé par TanStack Virtual)
  const gridParentRef = useRef(null)

  // Configuration du nombre de colonnes selon la taille d'écran
  const getColumnsCount = () => {
    if (typeof window === 'undefined') return 6
    const width = window.innerWidth
    if (width >= 1536) return 8 // 2xl
    if (width >= 1280) return 6 // xl
    if (width >= 1024) return 5 // lg
    if (width >= 768) return 4 // md
    if (width >= 640) return 3 // sm
    return 2 // mobile
  }

  const columnsCount = getColumnsCount()

  // Extraire toutes les pages des documents
  const allPages = useMemo(() => {
    const pages = []
    documents.forEach((doc) => {
      if (doc.pages && doc.pages.length > 0) {
        doc.pages.forEach((page) => {
          pages.push({ id: `${doc.id}-page-${page.pageNumber}`, documentId: doc.id, documentName: doc.name, pageNumber: page.pageNumber, type: page.type || 'image/png', url: page.url, size: doc.size / doc.pages.length, rotation: 0 })
        })
      } else if (doc.type === 'application/pdf') {
        const numPages = doc.numPages || 1
        for (let i = 1; i <= numPages; i++) {
          pages.push({ id: `${doc.id}-page-${i}`, documentId: doc.id, documentName: doc.name, pageNumber: i, type: doc.type, url: doc.url, size: (doc.size || 10000) / numPages, rotation: 0 })
        }
      } else {
        pages.push({ id: `${doc.id}-page-1`, documentId: doc.id, documentName: doc.name, pageNumber: 1, type: doc.type, url: doc.url, size: doc.size || 10000, rotation: 0 })
      }
    })
    return pages
  }, [documents])

  const [orderedPages, setOrderedPages] = useState(allPages)

  useEffect(() => {
    setOrderedPages(allPages)
  }, [allPages])

  // Gestion du drag & drop
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Supprimer une page
  const removePage = (pageId) => setOrderedPages((prev) => prev.filter((page) => page.id !== pageId))

  // Rotation d'une page
  const rotatePage = (pageId, rotation) => setOrderedPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, rotation } : page)))

  // Toggle sélection
  const togglePageSelection = (pageId) => setSelectedPageIds((prev) => { const newSet = new Set(prev); if (newSet.has(pageId)) newSet.delete(pageId); else newSet.add(pageId); return newSet })

  // Sélectionner tout
  const toggleSelectAll = () => setSelectedPageIds((prev) => (selectedPageIds.size === orderedPages.length ? new Set() : new Set(orderedPages.map((p) => p.id))))

  // Supprimer les pages sélectionnées
  const deleteSelectedPages = () => {
    if (selectedPageIds.size === 0) return
    if (confirm(`Supprimer ${selectedPageIds.size} page(s) sélectionnée(s) ?`)) {
      setOrderedPages((prev) => prev.filter((page) => !selectedPageIds.has(page.id)))
      setSelectedPageIds(new Set())
    }
  }

  // Classer les pages sélectionnées dans le dossier
  const assignPagesToNode = (node) => {
    if (selectedPageIds.size === 0) {
      alert('Veuillez sélectionner au moins une page à classer')
      return
    }

    const pagesToClassify = orderedPages.filter(p => selectedPageIds.has(p.id))

    console.log('Node received:', node)
    console.log('Node name:', node.name)
    console.log('Node text:', node.text)

    // IMPORTANT : Marquer ce traitement pour éviter les doublons
    const batchId = Date.now()

    // Créer UNE instance pour toutes les pages sélectionnées, nommée d'après la typologie
    setClassifiedPages((prevPages) => {
      // Créer une copie profonde de l'état actuel du nœud
      const currentNodeData = prevPages[node.id] || {}

      // Créer le nouvel objet de données pour le nœud
      const newNodeData = {}

      // Copier toutes les entrées existantes avec de nouveaux tableaux
      Object.keys(currentNodeData).forEach(docName => {
        newNodeData[docName] = [...currentNodeData[docName]]
      })

      // Utiliser le nom de la typologie comme clé principale (priorité à text, puis name)
      const typologyName = node.text || node.name || 'Document'

      console.log('Using typology name:', typologyName)

      // Créer le tableau si n'existe pas
      if (!newNodeData[typologyName]) {
        newNodeData[typologyName] = []
      }

      // Compter les instances existantes pour cette typologie
      const existingInstances = newNodeData[typologyName].filter(inst => inst._batchId !== batchId)
      const instanceNumber = existingInstances.length + 1

      // Générer le nom de l'instance avec incrémentation
      const instanceName = instanceNumber === 1
        ? typologyName
        : `${typologyName} (${instanceNumber})`

      // Créer la nouvelle instance
      const newInstance = {
        id: `${node.id}-${typologyName}-${instanceNumber}-${Date.now()}`,
        name: instanceName,
        originalName: typologyName,
        typologyName: typologyName,
        pages: pagesToClassify,
        sourceDocuments: [...new Set(pagesToClassify.map(p => p.documentName))],
        createdAt: new Date().toISOString(),
        _batchId: batchId
      }

      // Ajouter la nouvelle instance au tableau
      newNodeData[typologyName] = [...newNodeData[typologyName], newInstance]

      console.log(`Created instance: "${instanceName}" with ${pagesToClassify.length} pages`)
      console.log(`Total instances for "${typologyName}": ${newNodeData[typologyName].length}`)

      return {
        ...prevPages,
        [node.id]: newNodeData
      }
    })

    // Retirer les pages de la grille
    setOrderedPages((prev) => prev.filter(p => !selectedPageIds.has(p.id)))
    setSelectedPageIds(new Set())

    console.log(`Classified ${pagesToClassify.length} pages to ${node.text || node.name} (${node.id})`)
  }

  // Voir les pages classées d'un nœud
  const handleViewPages = (node) => {
    setViewingNode(node)
  }

  // Voir les pages d'une instance spécifique
  const handleViewInstance = (instance, nodeId) => {
    setViewingNode({ id: nodeId, isInstance: true, instance: instance, name: instance.name })
  }

  // Réinsérer les pages classées dans la grille
  const handleReinsertPages = (nodeOrInstance) => {
    // Si c'est une instance spécifique
    if (nodeOrInstance.isInstance) {
      const { id: nodeId, instance } = nodeOrInstance

      // Réinsérer les pages de l'instance
      setOrderedPages((prev) => [...prev, ...instance.pages])

      // Supprimer l'instance
      setClassifiedPages((prev) => {
        const nodeData = prev[nodeId]
        if (!nodeData) return prev

        const newNodeData = {}
        Object.entries(nodeData).forEach(([docName, instances]) => {
          newNodeData[docName] = instances.filter(inst => inst.id !== instance.id)
        })

        // Nettoyer les documents vides
        Object.keys(newNodeData).forEach(docName => {
          if (newNodeData[docName].length === 0) {
            delete newNodeData[docName]
          }
        })

        return {
          ...prev,
          [nodeId]: Object.keys(newNodeData).length > 0 ? newNodeData : undefined
        }
      })

      console.log(`Reinserted instance "${instance.name}" with ${instance.pages.length} pages`)
    } else {
      // C'est un nœud complet - réinsérer toutes les pages
      const nodeData = classifiedPages[nodeOrInstance.id]

      if (!nodeData || Object.keys(nodeData).length === 0) {
        alert('Aucune page à réinsérer dans ce dossier')
        return
      }

      let pagesToReinsert = []
      Object.values(nodeData).forEach(instances => {
        instances.forEach(instance => {
          pagesToReinsert = [...pagesToReinsert, ...instance.pages]
        })
      })

      // Ajouter les pages à la grille
      setOrderedPages((prev) => [...prev, ...pagesToReinsert])

      // Supprimer toutes les données du dossier
      setClassifiedPages((prev) => {
        const newState = { ...prev }
        delete newState[nodeOrInstance.id]
        return newState
      })

      console.log(`Reinserted ${pagesToReinsert.length} pages from ${nodeOrInstance.name}`)
    }
  }

  // Supprimer des instances spécifiques ou un nœud complet
  const handleDeleteNode = (nodeOrInstance) => {
    // Si c'est une instance spécifique
    if (nodeOrInstance.isInstance) {
      const { id: nodeId, instance } = nodeOrInstance

      setClassifiedPages((prev) => {
        const nodeData = prev[nodeId]
        if (!nodeData) return prev

        const newNodeData = {}
        Object.entries(nodeData).forEach(([docName, instances]) => {
          newNodeData[docName] = instances.filter(inst => inst.id !== instance.id)
        })

        // Nettoyer les documents vides
        Object.keys(newNodeData).forEach(docName => {
          if (newNodeData[docName].length === 0) {
            delete newNodeData[docName]
          }
        })

        return {
          ...prev,
          [nodeId]: Object.keys(newNodeData).length > 0 ? newNodeData : undefined
        }
      })

      // Si on visualisait ce nœud, fermer la visualisation
      if (viewingNode && viewingNode.id === nodeId) {
        setViewingNode(null)
      }

      console.log(`Deleted instance "${instance.name}"`)
    } else {
      // C'est un nœud complet - supprimer toutes les pages
      setClassifiedPages((prev) => {
        const newState = { ...prev }
        delete newState[nodeOrInstance.id]
        return newState
      })

      // Si on visualisait ce nœud, fermer la visualisation
      if (viewingNode && viewingNode.id === nodeOrInstance.id) {
        setViewingNode(null)
      }

      console.log(`Deleted node ${nodeOrInstance.name} and its classified pages`)
    }
  }

  // Fermer la visualisation des pages
  const closeViewPages = () => {
    setViewingNode(null)
  }

  // Réinitialiser
  const resetOrder = () => setOrderedPages(allPages)

  // Enregistrer
  const validateOrder = () => {
    console.log('Classification terminée:', classifiedPages)
    console.log('Pages restantes:', orderedPages)
    alert('Classification enregistrée ! (Fonctionnalité de sauvegarde à implémenter)')
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
              <h1 className="text-base md:text-xl font-bold text-[#605e5c] dark:text-dark-text truncate">Organiser la découpe</h1>
              <p className="text-xs md:text-sm text-[#605e5c] dark:text-dark-text hidden md:block">Sélectionnez des pages et classez-les dans les dossiers</p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto">
            {/* Bouton toggle pour l'arbre de typologie sur mobile */}
            <button
              onClick={() => setShowTypology(!showTypology)}
              className="md:hidden bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-3 py-2 rounded shadow flex items-center space-x-1 transition-all text-xs font-medium min-w-[44px] min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              <span>{showTypology ? 'Grille' : 'Arbre'}</span>
            </button>

            <span className="text-xs md:text-sm text-[#605e5c] dark:text-dark-text whitespace-nowrap">{orderedPages.length} pg{orderedPages.length > 1 ? 's' : ''}</span>

            <label className="flex items-center space-x-1 md:space-x-2 cursor-pointer shrink-0">
              <input type="checkbox" checked={selectedPageIds.size === orderedPages.length && orderedPages.length > 0} onChange={toggleSelectAll} className="w-4 h-4 md:w-4 md:h-4 rounded border-2 border-[#c8c6c4] dark:border-dark-borderLight text-[#106EBE] dark:text-blue-500 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:ring-2" />
              <span className="text-xs text-[#605e5c] dark:text-dark-text whitespace-nowrap">{selectedPageIds.size > 0 ? `${selectedPageIds.size} sel.` : 'Tout'}</span>
            </label>

            {selectedPageIds.size > 0 && (
              <button onClick={deleteSelectedPages} className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white px-2 md:px-4 py-2 rounded shadow flex items-center space-x-1 md:space-x-2 transition-all font-medium min-w-[44px] min-h-[44px]">
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span className="hidden sm:inline">Suppr.</span>
                <span className="hidden xs:inline">({selectedPageIds.size})</span>
              </button>
            )}

            <button onClick={resetOrder} className="bg-gray-200 hover:bg-gray-300 dark:bg-dark-bgTertiary dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text px-2 md:px-4 py-2 rounded shadow flex items-center space-x-1 md:space-x-2 transition-all font-medium min-w-[44px] min-h-[44px]" disabled={orderedPages.length === allPages.length}>
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span className="hidden sm:inline">Réinit.</span>
            </button>

            <button onClick={validateOrder} className="bg-[#106EBE] hover:bg-[#005a9e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-3 md:px-6 py-2 rounded shadow-lg flex items-center space-x-1 md:space-x-2 transition-all font-medium min-w-[44px] min-h-[44px]">
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span className="hidden sm:inline">Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal divisé en deux */}
      <div className="flex-1 flex overflow-hidden">
        {/* Zone gauche : Grille de pages - Virtualisée avec TanStack Virtual */}
        <div ref={gridParentRef} className={`flex-1 overflow-auto p-3 md:p-6 custom-scrollbar ${isMobile && showTypology ? 'hidden' : ''}`}>
          {orderedPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-[60px] md:text-[80px] text-[#c8c6c4] dark:text-dark-textTertiary mb-4">check_circle</span>
              <h2 className="text-lg md:text-xl font-semibold text-[#605e5c] dark:text-dark-text mb-2">Toutes les pages sont classées !</h2>
              <p className="text-sm text-[#605e5c] dark:text-dark-text">Sélectionnez un dossier pour voir les pages classées</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedPages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <GridVirtualizer
                  parentRef={gridParentRef}
                  orderedPages={orderedPages}
                  columnsCount={columnsCount}
                  removePage={removePage}
                  rotatePage={rotatePage}
                  setSelectedPage={setSelectedPage}
                  selectedPageIds={selectedPageIds}
                  togglePageSelection={togglePageSelection}
                />
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Zone droite : Arbre de typologie - caché sur mobile sauf si toggle */}
        <div className={`${isMobile ? 'w-full' : 'w-80 md:w-96'} border-l border-[#edebe9] dark:border-dark-border ${isMobile && !showTypology ? 'hidden' : ''}`}>
          {isMobile && (
            <div className="p-2 bg-[#faf9f8] dark:bg-dark-bgSecondary border-b border-[#edebe9] dark:border-dark-border flex items-center justify-between transition-colors duration-200">
              <span className="text-xs font-semibold text-[#605e5c] dark:text-dark-text">Arbre de typologie</span>
              <button
                onClick={() => setShowTypology(false)}
                className="p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
          <TypologyTree
            onNodeSelect={setSelectedTreeNode}
            onAssignPages={assignPagesToNode}
            selectedNode={selectedTreeNode}
            classifiedPages={classifiedPages}
            onViewPages={handleViewInstance}
            onReinsertPages={handleReinsertPages}
            onDeleteNode={handleDeleteNode}
          />
        </div>
      </div>

      {/* Modal de visualisation */}
      {selectedPage && <PageModal page={selectedPage} onClose={() => setSelectedPage(null)} />}

      {/* Modal des pages classées */}
      {viewingNode && (
        <ClassifiedPagesModal
          node={viewingNode}
          instancesData={viewingNode.isInstance ? { [viewingNode.instance.name]: [viewingNode.instance] } : (classifiedPages[viewingNode.id] || {})}
          onClose={closeViewPages}
          onReinsert={(instances) => handleReinsertPages(viewingNode.isInstance ? viewingNode : viewingNode, viewingNode.isInstance ? instances : null)}
          onDeleteInstances={(instances) => handleDeleteNode(viewingNode.isInstance ? { id: viewingNode.id, isInstance: true, instance: instances[0] } : viewingNode)}
        />
      )}
    </div>
  )
}

export default OrganizePage
