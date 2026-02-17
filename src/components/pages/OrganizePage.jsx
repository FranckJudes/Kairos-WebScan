import { useState, useRef, Suspense, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import { ZoomIn, ZoomOut, RotateCw, X, Trash2, ArrowLeft, FolderTree, RotateCcw, Save, CheckCircle2, Loader2, Crop } from 'lucide-react'
import { Cropper } from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TypologyTree from '../ui/TypologyTree'
import { useMobile } from '../../hooks/useMediaQuery'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useOrganizePages } from '../../hooks/useOrganizePages'
import { useClassifiedPages } from '../../hooks/useClassifiedPages'
import toast from 'react-hot-toast'
import { api } from '../../services/api'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, pageCount }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#605e5c] dark:text-dark-text">Supprimer les pages</h3>
        </div>
        <p className="text-sm text-[#605e5c] dark:text-dark-text mb-6">
          Êtes-vous sûr de vouloir supprimer {pageCount} page{pageCount > 1 ? 's' : ''} ?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#edebe9] dark:border-dark-border text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant Modal pour visualiser une page en grand
function PageModal({ page, onClose, rotatePage, updatePageUrl }) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(page.rotation || 0)
  const [isCropMode, setIsCropMode] = useState(false)
  const cropperRef = useRef(null)
  const [pdfImageDataUrl, setPdfImageDataUrl] = useState(null) // Pour stocker l'image convertie du PDF
  const [isConvertingPdf, setIsConvertingPdf] = useState(false)

  // Synchroniser la rotation quand page.rotation change
  useEffect(() => {
    setRotation(page.rotation || 0)
  }, [page.rotation])

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setScale(1)
  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    rotatePage(page.id, newRotation)
  }

  const startCrop = async () => {
    // Si c'est un PDF, on doit d'abord le convertir en image
    if (isPdf) {
      setIsConvertingPdf(true)
      toast.loading('Conversion du PDF en image...')

      try {
        // Charger le document PDF
        const loadingTask = pdfjs.getDocument(page.url)
        const pdf = await loadingTask.promise

        // Récupérer la page
        const pdfPage = await pdf.getPage(page.pageNumber)

        // Calculer les dimensions avec le scale actuel
        const viewport = pdfPage.getViewport({ scale: scale * 2 }) // Échelle plus haute pour meilleure qualité

        // Créer un canvas
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        // Rendre la page dans le canvas
        await pdfPage.render({ canvasContext: context, viewport: viewport }).promise

        // Convertir le canvas en data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95)
        setPdfImageDataUrl(imageDataUrl)
        setIsCropMode(true)

        toast.dismiss()
        toast.success('PDF converti - Vous pouvez maintenant rogner')
      } catch (error) {
        console.error('Erreur lors de la conversion du PDF:', error)
        toast.dismiss()
        toast.error('Erreur lors de la conversion du PDF')
      } finally {
        setIsConvertingPdf(false)
      }
    } else {
      // Pour les images, on active simplement le mode rognage
      setIsCropMode(true)
    }
  }

  const cancelCrop = () => {
    setIsCropMode(false)
    setPdfImageDataUrl(null) // Nettoyer l'image convertie du PDF
  }

  const applyCrop = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) {
      toast.error('Veuillez sélectionner une zone à rogner')
      return
    }

    try {
      // Get cropped canvas
      const canvas = cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        fillColor: '#fff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })

      if (!canvas) {
        toast.error('Erreur lors de la création de l\'image rognée')
        return
      }

      // Uploader l'image rognée au serveur
      toast.loading('Upload de l\'image rognée...', { id: 'crop-upload' })

      const filename = `${page.documentName}_page_${page.pageNumber}_cropped_${Date.now()}.jpg`
      const uploadedUrl = await api.uploadCroppedImage(canvas, filename)

      // Mettre à jour l'URL de la page avec l'URL uploadée
      updatePageUrl(page.id, uploadedUrl)

      toast.dismiss('crop-upload')
      toast.success('Image rognée appliquée')
      setIsCropMode(false)
      setPdfImageDataUrl(null)
    } catch (error) {
      console.error('Erreur lors du rognage:', error)
      toast.dismiss('crop-upload')
      toast.error('Erreur lors du rognage')
    }
  }

  // Vérifier si c'est un PDF (attention : une page rognée devient une image data URL)
  const isPdf = page.url && !page.url.startsWith('data:image') && page.url.toLowerCase().endsWith('.pdf') && !page.url.includes('/api/WiaScanner/image')
  const canCrop = true // Le rognage est disponible pour tous les types de fichiers

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] md:max-w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header avec actions */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm border-b border-[#edebe9] dark:border-dark-border px-4 py-2 shadow-sm rounded-t-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs md:text-sm font-semibold text-[#605e5c] dark:text-dark-text truncate max-w-[150px] md:max-w-md">{page.documentName}</h3>
                <span className="text-[9px] md:text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary bg-[#f3f2f1] dark:bg-dark-bgTertiary px-2 py-0.5 rounded-full whitespace-nowrap">
                  Pg {page.pageNumber}
                </span>
              </div>
              <div className="h-4 w-px bg-[#edebe9] dark:border-dark-border"></div>
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Zoom controls */}
              <div className="flex items-center space-x-1 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg p-1">
                <button
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-[20px] h-[20px] text-[#605e5c] dark:text-dark-text" />
                </button>
                <button
                  onClick={resetZoom}
                  className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all text-xs font-medium text-[#605e5c] dark:text-dark-text min-w-[50px] text-center"
                  title="Réinitialiser zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  disabled={scale >= 3}
                  className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-[20px] h-[20px] text-[#605e5c] dark:text-dark-text" />
                </button>
              </div>

              <div className="h-6 w-px bg-[#edebe9] dark:border-dark-border hidden sm:block"></div>

              {/* Rotation */}
              <div className="flex items-center space-x-1 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg p-1">
                <button
                  onClick={() => {
                    const newRotation = (rotation - 90) % 360
                    setRotation(newRotation)
                    rotatePage(page.id, newRotation)
                  }}
                  className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all"
                  title="Rotation gauche (-90°)"
                >
                  <RotateCcw className="w-[20px] h-[20px] text-[#605e5c] dark:text-dark-text" />
                </button>
                <button
                  onClick={() => {
                    setRotation(0)
                    rotatePage(page.id, 0)
                  }}
                  disabled={rotation === 0}
                  className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-[#605e5c] dark:text-dark-text min-w-[50px] text-center"
                  title="Réinitialiser rotation"
                >
                  {rotation}°
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all"
                  title="Rotation droite (+90°)"
                >
                  <RotateCw className="w-[20px] h-[20px] text-[#605e5c] dark:text-dark-text" />
                </button>
              </div>

              <div className="h-6 w-px bg-[#edebe9] dark:border-dark-border hidden sm:block"></div>

              {/* Rogner - disponible pour tous les types de fichiers */}
              {canCrop && !isConvertingPdf && (
                isCropMode ? (
                  <>
                    {/* Annuler le rognage */}
                    <button
                      onClick={cancelCrop}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all"
                      title="Annuler le rognage"
                    >
                      <Crop className="w-[20px] h-[20px]" />
                    </button>

                    {/* Appliquer le rognage */}
                    <button
                      onClick={applyCrop}
                      className="p-2 rounded-lg bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 hover:shadow-sm transition-all flex items-center space-x-1"
                      title="Appliquer le rognage"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white">check</span>
                      <span className="hidden md:inline text-xs font-medium text-white">Appliquer</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startCrop}
                    className="p-2 rounded-lg bg-[#f3f2f1] dark:bg-dark-bgTertiary hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all text-[#605e5c] dark:text-dark-text flex items-center space-x-1"
                    title={isPdf ? "Rogner (conversion PDF requise)" : "Rogner la page"}
                  >
                    <Crop className="w-[20px] h-[20px]" />
                    <span className="hidden md:inline text-xs font-medium">Rogner</span>
                  </button>
                )
              )}

              {/* Indicateur de conversion PDF */}
              {isConvertingPdf && (
                <div className="p-2">
                  <Loader2 className="w-[20px] h-[20px] text-[#106EBE] dark:text-blue-400 animate-spin" />
                </div>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:shadow-sm transition-all"
                title="Fermer"
              >
                <X className="w-[20px] h-[20px]" />
              </button>
            </div>
          </div>

          {/* Crop mode indicator */}
          {isCropMode && (
            <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center space-x-2">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px]">info</span>
              <span className="text-xs text-amber-800 dark:text-amber-200">
                Mode rognage activé - Ajustez la zone de rognage et cliquez sur Appliquer
              </span>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="bg-gray-100 dark:bg-dark-bg rounded-b-lg p-2 md:p-4 overflow-auto flex items-center justify-center relative" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {isConvertingPdf ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#106EBE] dark:text-blue-400 animate-spin mb-4" />
              <p className="text-sm text-[#605e5c] dark:text-dark-text">Conversion du PDF en image...</p>
            </div>
          ) : isPdf && !isCropMode ? (
            <div
              className="transition-transform duration-300"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              <Document file={page.url} loading={<div className="flex items-center justify-center"><Loader2 className="w-10 h-10 text-gray-400 dark:text-dark-textTertiary animate-spin" /></div>}>
                <Page pageNumber={page.pageNumber} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          ) : isCropMode ? (
            <Cropper
              ref={cropperRef}
              src={isPdf ? pdfImageDataUrl : page.url}
              style={{ height: '70vh', width: '100%' }}
              initialAspectRatio={NaN}
              guides={true}
              viewMode={1}
              minCropBoxWidth={100}
              minCropBoxHeight={100}
              autoCropArea={1}
              checkOrientation={false}
              cropBoxMovable={true}
              cropBoxResizable={true}
              dragMode="move"
            />
          ) : (
            <div
              className="relative"
              style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transformOrigin: 'center', transition: 'transform 0.3s ease-in-out' }}
            >
              <img src={page.url} alt={`${page.documentName} - Page ${page.pageNumber}`} className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SortablePage({ page, index, removePage, rotatePage, onClick, isSelected, onToggleSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })
  const [rotation, setRotation] = useState(page.rotation || 0)

  // Synchroniser la rotation quand page.rotation change
  useEffect(() => {
    setRotation(page.rotation || 0)
  }, [page.rotation])

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    rotatePage(page.id, newRotation)
  }

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className={`relative bg-white dark:bg-dark-bgSecondary rounded-lg shadow-sm border-2 transition-all group ${isDragging ? 'border-[#106EBE] dark:border-blue-400 opacity-50 scale-95 z-50' : isSelected ? 'border-[#106EBE] dark:border-blue-400 ring-2 ring-[#106EBE]/20 dark:ring-blue-400/20' : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE] dark:hover:border-blue-400 hover:shadow-md'}`}>
      <div className="absolute top-2 left-2 z-20 pointer-events-auto">
        <input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(page.id)} className="w-5 h-5 rounded border-2 border-[#c8c6c4] dark:border-dark-borderLight text-[#106EBE] dark:text-blue-500 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:ring-2 cursor-pointer" />
      </div>
      <div className={`absolute top-2 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10 pointer-events-none ${isSelected ? 'bg-[#106EBE] dark:bg-blue-500 w-7 h-7 left-9' : 'bg-black/50 dark:bg-white/30 px-1.5 left-10'}`}>
        {index + 1}
      </div>
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <button onClick={handleRotate} className="bg-[#f3f2f1] dark:bg-dark-bgTertiary hover:bg-[#106EBE] dark:hover:bg-blue-500 hover:text-white text-[#605e5c] dark:text-dark-text p-1.5 rounded shadow-sm transition-colors" title="Rotation 90°">
          <RotateCw className="w-[14px] h-[14px]" />
        </button>
        <button onClick={() => removePage(page.id)} className="bg-red-100 dark:bg-red-900/30 hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white p-1.5 rounded shadow-sm transition-colors" title="Supprimer">
          <Trash2 className="w-[14px] h-[14px]" />
        </button>
      </div>
      <div className="p-3">
        <div className="aspect-[3/4] bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg mb-2 overflow-hidden relative cursor-pointer hover:bg-[#e1dfdd] dark:hover:bg-dark-hover transition-colors" onClick={onClick}>
          {page.url && page.url.toLowerCase().endsWith('.pdf') && !page.url.includes('/api/WiaScanner/image') ? (
            <div className="w-full h-full flex items-center justify-center">
              <Document
                file={page.url}
                loading={<div className="w-full h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-gray-400 dark:text-dark-textTertiary animate-spin" /></div>}
              >
                <Page pageNumber={page.pageNumber} scale={0.2} renderTextLayer={false} renderAnnotationLayer={false} className="max-w-full max-h-full" />
              </Document>
            </div>
          ) : (
            <img src={page.url} alt={page.documentName} className="w-full h-full object-cover transition-transform duration-300" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }} />
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="material-symbols-outlined text-white dark:text-dark-text text-3xl drop-shadow-lg">zoom_in</span>
          </div>
        </div>
      </div>
      <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move bg-white dark:bg-dark-bgSecondary rounded-l shadow-md p-1" {...attributes} {...listeners}>
        <svg className="w-5 h-5 text-[#605e5c] dark:text-dark-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>
    </div>
  )
}

function GridVirtualizer({ parentRef, orderedPages, columnsCount, removePage, rotatePage, setSelectedPage, selectedPageIds, togglePageSelection }) {
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(orderedPages.length / columnsCount),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 3,
  })

  const getRowPages = (rowIndex) => {
    const start = rowIndex * columnsCount
    const end = Math.min(start + columnsCount, orderedPages.length)
    return orderedPages.slice(start, end)
  }

  return (
    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const rowPages = getRowPages(virtualRow.index)
        return (
          <div
            key={virtualRow.index}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
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
  const isMobile = useMobile()
  const gridParentRef = useRef(null)

  const {
    orderedPages,
    isLoading,
    isWebSocketConnected,
    resetOrder,
    removePage,
    removePages,
    reorderPages,
    addPages,
    rotatePage,
    updatePageUrl,
  } = useOrganizePages()

  const [selectedPage, setSelectedPage] = useState(null)
  const [selectedPageIds, setSelectedPageIds] = useState(new Set())
  const [selectedTreeNode, setSelectedTreeNode] = useState(null)
  const [viewingNode, setViewingNode] = useState(null)
  const [showTypology, setShowTypology] = useState(false)
  const [classifiedPages, setClassifiedPages] = useState({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { classifyPages, reinsertPages, deleteInstances } = useClassifiedPages(setClassifiedPages)

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const getColumnsCount = () => {
    if (typeof window === 'undefined') return 6
    const width = window.innerWidth
    if (width >= 1536) return 8
    if (width >= 1280) return 6
    if (width >= 1024) return 5
    if (width >= 768) return 4
    if (width >= 640) return 3
    return 2
  }

  const columnsCount = getColumnsCount()

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = orderedPages.findIndex((item) => item.id === active.id)
      const newIndex = orderedPages.findIndex((item) => item.id === over.id)
      reorderPages(oldIndex, newIndex)
    }
  }

  // Toggle sélection
  const togglePageSelection = (pageId) => setSelectedPageIds((current) => {
    const newSet = new Set(current)
    if (newSet.has(pageId)) newSet.delete(pageId)
    else newSet.add(pageId)
    return newSet
  })

  // Sélectionner tout
  const toggleSelectAll = () => setSelectedPageIds(() =>
    selectedPageIds.size === orderedPages.length ? new Set() : new Set(orderedPages.map((p) => p.id))
  )

  // Supprimer les pages sélectionnées
  const deleteSelectedPages = () => {
    if (selectedPageIds.size === 0) return
    setShowDeleteModal(true)
  }

  const confirmDeletePages = () => {
    removePages(selectedPageIds)
    setSelectedPageIds(new Set())
    setShowDeleteModal(false)
  }

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

  // Enregistrer
  const validateOrder = () => {
    toast.success('Classification enregistrée !')
  }

  // Afficher le chargement initial
  if (isLoading && orderedPages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#f3f2f1] dark:bg-dark-bg transition-colors duration-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#106EBE] dark:text-blue-400 animate-spin mb-4" />
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
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-xs md:text-sm hidden sm:inline">Retour</span>
            </button>
            <div className="h-6 w-px bg-[#edebe9] dark:bg-dark-border hidden md:block"></div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-[#605e5c] dark:text-dark-text truncate">Organiser la découpe</h1>
              <p className="text-xs md:text-sm text-[#605e5c] dark:text-dark-text hidden md:block">Sélectionnez des pages et classez-les dans les dossiers</p>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto">
            <button onClick={() => setShowTypology(!showTypology)} className="md:hidden bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-3 py-2 rounded shadow flex items-center space-x-1 transition-all text-xs font-medium min-w-[44px] min-h-[44px]">
              <FolderTree className="w-[18px] h-[18px]" />
              <span>{showTypology ? 'Grille' : 'Arbre'}</span>
            </button>
            <span className="text-xs md:text-sm text-[#605e5c] dark:text-dark-text whitespace-nowrap">{orderedPages.length} pg{orderedPages.length > 1 ? 's' : ''}</span>

            <label className="flex items-center space-x-1 md:space-x-2 cursor-pointer shrink-0">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedPageIds.size === orderedPages.length && orderedPages.length > 0}
                  onChange={toggleSelectAll}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#edebe9] dark:bg-dark-bgTertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#106EBE] dark:peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:after:border-gray-600 peer-checked:bg-[#106EBE] dark:peer-checked:bg-blue-500"></div>
              </div>
              <span className="text-xs text-[#605e5c] dark:text-dark-text whitespace-nowrap">{selectedPageIds.size > 0 ? `${selectedPageIds.size} sel.` : 'Tout'}</span>
            </label>
            {selectedPageIds.size > 0 && (
              <button onClick={deleteSelectedPages} className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600 text-white px-2 md:px-4 py-2 rounded shadow flex items-center space-x-1 md:space-x-2 transition-all font-medium min-w-[44px] min-h-[44px]">
                <Trash2 className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">Suppr.</span>
                <span className="hidden xs:inline">({selectedPageIds.size})</span>
              </button>
            )}
            <button onClick={resetOrder} className="bg-gray-200 hover:bg-gray-300 dark:bg-dark-bgTertiary dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text px-2 md:px-4 py-2 rounded shadow flex items-center space-x-1 md:space-x-2 transition-all font-medium min-w-[44px] min-h-[44px]" disabled={orderedPages.length === 0}>
              <RotateCcw className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Réinit.</span>
            </button>
            <button onClick={validateOrder} className="bg-[#106EBE] hover:bg-[#005a9e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-3 md:px-6 py-2 rounded shadow-lg flex items-center space-x-1 md:space-x-2 transition-all font-medium min-w-[44px] min-h-[44px]">
              <Save className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Enregistrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        <div ref={gridParentRef} className={`flex-1 overflow-auto p-3 md:p-6 custom-scrollbar ${isMobile && showTypology ? 'hidden' : ''}`}>
          {orderedPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <CheckCircle2 className="w-[60px] h-[60px] md:w-[80px] md:h-[80px] text-[#c8c6c4] dark:text-dark-textTertiary mb-4" />
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

        {/* Zone droite : Arbre de typologie */}
        <div className={`${isMobile ? 'w-full' : 'w-80 md:w-96'} border-l border-[#edebe9] dark:border-dark-border ${isMobile && !showTypology ? 'hidden' : ''}`}>
          {isMobile && (
            <div className="p-2 bg-[#faf9f8] dark:bg-dark-bgSecondary border-b border-[#edebe9] dark:border-dark-border flex items-center justify-between transition-colors duration-200">
              <span className="text-xs font-semibold text-[#605e5c] dark:text-dark-text">Arbre de typologie</span>
              <button onClick={() => setShowTypology(false)} className="p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
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

      {/* Modal de visualisation */}
      {selectedPage && <PageModal page={selectedPage} onClose={() => setSelectedPage(null)} rotatePage={rotatePage} updatePageUrl={updatePageUrl} />}

      {/* Modal de confirmation de suppression */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeletePages}
        pageCount={selectedPageIds.size}
      />

      {/* Modal des pages classées - placeholder pour l'instant */}
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

export default OrganizePage
