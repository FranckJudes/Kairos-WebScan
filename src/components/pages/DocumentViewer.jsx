import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import { useBannettes } from '../../hooks/useBannettes'
import { useOrganizePages } from '../../hooks/useOrganizePages'
import FileDropZone from '../ui/FileDropZone'
import PDFViewer from '../ui/PDFViewer'
import { useMobile } from '../../hooks/useMediaQuery'
import toast from 'react-hot-toast'
import { Cropper } from 'react-cropper'
import 'cropperjs/dist/cropper.css'
import * as pdfjsLib from 'pdfjs-dist'
import { api } from '../../services/api'

function DocumentViewer() {
  const navigate = useNavigate()
  const { selectedDocument, addDocuments, selectedPageNumber, setSelectedPageNumber, updateDocumentNumPages, updatePageUrl, documentVersion, clearDocuments } = useDocuments()
  const { orderedPages } = useOrganizePages()
  const { createBannette, isCreating } = useBannettes()
  const [scale, setScale] = useState(1.0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [bannetteName, setBannetteName] = useState('')
  const [bannetteDescription, setBannetteDescription] = useState('')
  const isMobile = useMobile()
  const [rotation, setRotation] = useState(0)
  const [isCropMode, setIsCropMode] = useState(false)
  const cropperRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const documentRef = useRef(null)
  const [pdfImageDataUrl, setPdfImageDataUrl] = useState(null)
  const [isConvertingPdf, setIsConvertingPdf] = useState(false)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addDocuments(files)
  }

  const handlePageLoad = (numPages) => {
    if (selectedDocument) {
      updateDocumentNumPages(selectedDocument.id, numPages)
    }
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setScale(1.0)

  const rotateLeft = () => setRotation(prev => prev - 90)
  const rotateRight = () => setRotation(prev => prev + 90)
  const resetRotation = () => setRotation(0)

  const goToPreviousPage = () => {
    if (selectedPageNumber > 1) {
      setSelectedPageNumber(selectedPageNumber - 1)
    } 
  }

  const goToNextPage = () => {
    const maxPage = selectedDocument?.numPages || selectedDocument?.pages?.length || undefined
    if (!maxPage || selectedPageNumber < maxPage) {
      setSelectedPageNumber(selectedPageNumber + 1)
    } 
  }

  const toggleCropMode = async () => {
    if (!isCropMode && isPdfDocument) {
      setIsConvertingPdf(true)
      toast.loading('Conversion du PDF en image...', { id: 'pdf-conversion' })

      try {
        const loadingTask = pdfjsLib.getDocument(selectedDocument.url)
        const pdf = await loadingTask.promise

        const pdfPage = await pdf.getPage(pdfPageNumber)

        const viewport = pdfPage.getViewport({ scale: scale * 2 })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        await pdfPage.render({ canvasContext: context, viewport: viewport }).promise

        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95)
        setPdfImageDataUrl(imageDataUrl)
        setIsCropMode(true)

        toast.dismiss('pdf-conversion')
        toast.success('PDF converti - Vous pouvez maintenant rogner')
      } catch (error) {
        toast.dismiss('pdf-conversion')
        toast.error('Erreur lors de la conversion du PDF')
      } finally {
        setIsConvertingPdf(false)
      }
    } else if (!isCropMode && !isPdfDocument) {
      setIsCropMode(true)
      toast.success('Mode rognage activé - Sélectionnez la zone à conserver')
    } else {
      setIsCropMode(false)
      setPdfImageDataUrl(null)
    }
  }

  const applyCrop = async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper) {
      toast.error('Veuillez sélectionner une zone à rogner')
      return
    }

    try {
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

      toast.loading('Upload de l\'image rognée...', { id: 'crop-upload' })

      const filename = `${selectedDocument.name}_page_${selectedPageNumber}_cropped_${Date.now()}.jpg`
      const uploadedUrl = await api.uploadCroppedImage(canvas, filename)

      await updatePageUrl(selectedDocument.id, pdfPageNumber, uploadedUrl)

      toast.dismiss('crop-upload')
      toast.success('Image rognée appliquée')
      setIsCropMode(false)
      setPdfImageDataUrl(null)
    } catch (error) {
      toast.dismiss('crop-upload')
      toast.error('Erreur lors du rognage')
    }
  }

  const toggleFullscreen = () => {
    if (!documentRef.current) return

    if (!isFullscreen) {
      if (documentRef.current.requestFullscreen) {
        documentRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const goToOrganize = () => {
    navigate('/organize')
  }



  const hasMultiplePages = selectedDocument?.pages && selectedDocument.pages.length > 1
  const numPages = selectedDocument?.numPages || 1

  const currentPage = selectedDocument?.pages?.find(p => p.pageNumber === selectedPageNumber)
  const pdfPageNumber = (currentPage?.originalPageNumber !== undefined && currentPage?.originalPageNumber !== selectedPageNumber)
    ? currentPage.originalPageNumber
    : selectedPageNumber

  const currentPageUrl = hasMultiplePages
    ? currentPage?.url || selectedDocument.pages[0]?.url
    : selectedDocument?.url

  const isPdfDocument = selectedDocument?.type === 'application/pdf' &&
    !currentPageUrl?.startsWith('data:image') &&
    !currentPageUrl?.toLowerCase().endsWith('.jpg') &&
    !currentPageUrl?.toLowerCase().endsWith('.jpeg') &&
    !currentPageUrl?.toLowerCase().endsWith('.png') &&
    !currentPageUrl?.toLowerCase().endsWith('.webp') &&
    !currentPageUrl?.toLowerCase().endsWith('.gif')

  const handleSave = async () => {
    setShowSaveModal(true)
  }

  const confirmSave = async () => {
    try {
      await createBannette(
        bannetteName || `Bannette ${new Date().toLocaleDateString('fr-FR')}`,
        orderedPages,
        {},
        orderedPages.length,
        bannetteDescription || null
      )

      setShowSaveModal(false)
      setBannetteName('')
      setBannetteDescription('')
      toast.success('Sauvegardé dans les bannettes !')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleClear = () => {
    clearDocuments()
    toast.success('Tous les documents ont été supprimés')
  }

  if (!selectedDocument) {
    return (
      <main className="flex-1 relative overflow-auto p-4 md:p-12 flex justify-center items-center custom-scrollbar">
        <FileDropZone
          onDrop={addDocuments}
          className="w-full max-w-2xl"
        >
          <div className="border-2 border-dashed border-[#c8c6c4] dark:border-dark-borderLight rounded-lg p-8 md:p-16 text-center hover:border-[#106EBE] dark:hover:border-blue-400 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-all cursor-pointer bg-white dark:bg-dark-bgSecondary">
            <span className="material-symbols-outlined text-[60px] md:text-[80px] text-[#106EBE] dark:text-blue-400 mb-4 md:mb-6">cloud_upload</span>
            <h2 className="text-xl md:text-2xl font-bold text-[#605e5c] dark:text-dark-text mb-4">Import your documents</h2>
            <p className="text-sm text-[#605e5c] dark:text-dark-text mb-6 max-w-md mx-auto">
              Drag & drop files here, or click to browse
            </p>
            <div className="space-y-2 text-xs text-[#605e5c] dark:text-dark-text mb-6">
              <p>Supported formats: PDF, JPG, PNG, TIFF, BMP, WEBP</p>
              <p>Maximum file size: 1 GB</p>
            </div>
            <label className="inline-flex items-center space-x-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-full shadow-lg cursor-pointer transition-all transform hover:scale-105">
              <span className="material-symbols-outlined">folder_open</span>
              <span className="font-semibold">Browse Files</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
                multiple
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </FileDropZone>
      </main>
    )
  }

  return (
    <>
    <main ref={documentRef} className="flex-1 relative overflow-hidden flex flex-col">
      <div className="p-2 md:p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0 shrink-0 transition-colors duration-200">
        <div className="flex items-center justify-between w-full md:w-auto md:space-x-3">
          <div className="flex items-center space-x-2 min-w-0">
            <h2 className="text-xs md:text-sm font-semibold text-[#605e5c] dark:text-dark-text truncate max-w-[150px] md:max-w-md">{selectedDocument.name}</h2>
            <span className="text-[9px] md:text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary hidden sm:inline">
              {(selectedDocument.size / 1024).toFixed(1)} KB • {new Date(selectedDocument.createdAt).toLocaleDateString()}
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] font-medium text-[#605e5c] dark:text-dark-text uppercase tracking-wider bg-[#f3f2f1] dark:bg-dark-bgTertiary px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
            {selectedDocument.type?.split('/')[1]?.toUpperCase() || selectedDocument.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
            <button
              onClick={goToOrganize}
              className="bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded shadow-lg flex items-center space-x-1 md:space-x-2 transition-all text-xs md:text-sm font-medium min-w-[44px] min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[18px]">reorder</span>
              <span className="hidden sm:inline">Réorganiser</span>
            </button>
            <button
              onClick={handleSave}
              className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-3 md:px-4 py-2 rounded shadow-lg flex items-center space-x-1 md:space-x-2 transition-all text-xs md:text-sm font-medium min-w-[44px] min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[18px]">save</span>
              <span className="hidden sm:inline">Enregistrer</span>
            </button>
            <button
              onClick={handleClear}
              className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white px-3 md:px-4 py-2 rounded shadow-lg flex items-center space-x-1 md:space-x-2 transition-all text-xs md:text-sm font-medium min-w-[44px] min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[18px]">delete</span>
              <span className="hidden sm:inline">Vider</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-dark-bg">
        <div className="relative min-h-full">
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-sm border-b border-[#edebe9] dark:border-dark-border px-4 py-2 shadow-sm">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-[#605e5c] dark:text-dark-text uppercase tracking-wide">
                  Actions page
                </span>
                <div className="h-4 w-px bg-[#edebe9] dark:border-dark-border"></div>
              </div>

              <div className="flex items-center space-x-1 md:space-x-2">
                {(isPdfDocument || hasMultiplePages) && (
                  <>
                    <span className="text-[9px] md:text-[10px] text-[#605e5c] dark:text-dark-text whitespace-nowrap font-medium">Pg {selectedPageNumber}/{numPages}</span>

                    <div className="flex items-center space-x-1 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg p-1">
                      <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Zoom arrière"
                      >
                        <span className="material-symbols-outlined text-[20px] text-[#605e5c] dark:text-dark-text">zoom_out</span>
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
                        <span className="material-symbols-outlined text-[20px] text-[#605e5c] dark:text-dark-text">zoom_in</span>
                      </button>
                    </div>

                    <div className="h-6 w-px bg-[#edebe9] dark:border-dark-border hidden sm:block"></div>
                  </>
                )}

                <div className="flex items-center space-x-1 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg p-1">
                  <button
                    onClick={rotateLeft}
                    className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all"
                    title="Rotation gauche (-90°)"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#605e5c] dark:text-dark-text">rotate_left</span>
                  </button>
                  <button
                    onClick={resetRotation}
                    disabled={rotation === 0}
                    className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-[#605e5c] dark:text-dark-text min-w-[50px] text-center"
                    title="Réinitialiser rotation"
                  >
                    {rotation}°
                  </button>
                  <button
                    onClick={rotateRight}
                    className="p-2 rounded hover:bg-white dark:hover:bg-dark-bg hover:shadow-sm transition-all"
                    title="Rotation droite (+90°)"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#605e5c] dark:text-dark-text">rotate_right</span>
                  </button>
                </div>

                <div className="h-6 w-px bg-[#edebe9] dark:border-dark-border hidden sm:block"></div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={toggleCropMode}
                    disabled={isConvertingPdf}
                    className={`p-2 rounded-lg hover:shadow-sm transition-all flex items-center space-x-1 ${
                      isCropMode
                        ? 'bg-[#106EBE] dark:bg-blue-600 text-white'
                        : 'bg-[#f3f2f1] dark:bg-dark-bgTertiary hover:bg-white dark:hover:bg-dark-bg text-[#605e5c] dark:text-dark-text'
                    } ${isConvertingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isPdfDocument ? "Rogner (conversion PDF requise)" : "Rogner la page"}
                  >
                    {isConvertingPdf ? (
                      <>
                        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                        <span className="hidden md:inline text-xs font-medium">Conversion...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">crop</span>
                        <span className="hidden md:inline text-xs font-medium">Rogner</span>
                      </>
                    )}
                  </button>

                  {isCropMode && !isConvertingPdf && (
                    <button
                      onClick={applyCrop}
                      className="p-2 rounded-lg bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 hover:shadow-sm transition-all flex items-center space-x-1"
                      title="Appliquer le rognage"
                    >
                      <span className="material-symbols-outlined text-[20px] text-white">check</span>
                      <span className="hidden md:inline text-xs font-medium text-white">Appliquer</span>
                    </button>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    className={`p-2 rounded-lg hover:shadow-sm transition-all ${
                      isFullscreen
                        ? 'bg-[#106EBE] dark:bg-blue-600 text-white'
                        : 'bg-[#f3f2f1] dark:bg-dark-bgTertiary hover:bg-white dark:hover:bg-dark-bg text-[#605e5c] dark:text-dark-text'
                    }`}
                    title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
                  >
                    <span className="material-symbols-outlined text-[20px]">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                  </button>
                </div>
              </div>
            </div>

            {isCropMode && (
              <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center space-x-2">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[18px]">info</span>
                <span className="text-xs text-amber-800 dark:text-amber-200">
                  Mode rognage activé - Ajustez la zone de rognage et cliquez sur Appliquer
                </span>
              </div>
            )}
          </div>

          <div
            className={`flex justify-center items-center p-4 md:p-8 transition-transform duration-300 ${
              rotation !== 0 ? 'origin-center' : ''
            }`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease-in-out'
            }}
          >
            {isConvertingPdf ? (
              <div className="flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[60px] md:text-[80px] text-[#106EBE] dark:text-blue-400 animate-spin mb-4" />
                <p className="text-lg text-[#605e5c] dark:text-dark-text">Conversion du PDF en image...</p>
              </div>
            ) : isPdfDocument && isCropMode ? (
              <div className="w-full max-w-[850px] bg-white dark:bg-dark-bgSecondary document-view h-fit mb-8 md:mb-12 overflow-hidden transition-colors duration-200">
                <Cropper
                  ref={cropperRef}
                  src={pdfImageDataUrl}
                  style={{ height: '80vh', width: '100%' }}
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
              </div>
            ) : isPdfDocument ? (
              <>
                <PDFViewer
                  url={selectedDocument.url}
                  fileName={selectedDocument.name}
                  pageNumber={pdfPageNumber}
                  onPageLoad={handlePageLoad}
                  scale={scale}
                />
              </>
            ) : (
              <div className="relative w-full max-w-[850px] bg-white dark:bg-dark-bgSecondary document-view h-fit mb-8 md:mb-12 overflow-hidden transition-colors duration-200">
                {isCropMode ? (
                  <Cropper
                    ref={cropperRef}
                    src={currentPageUrl}
                    style={{ height: '80vh', width: '100%' }}
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
                  <>
                    <img
                      src={currentPageUrl}
                      alt={`${selectedDocument.name} - Page ${selectedPageNumber}`}
                      className="w-auto h-auto object-contain"
                      style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                    />

                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDocument && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={selectedPageNumber <= 1}
              className="w-12 h-12 rounded-full bg-blue-400 shadow-lg border border-blue-300 flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              title="Page précédente"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">chevron_left</span>
            </button>

            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="w-12 h-12 rounded-full bg-blue-400 shadow-lg border border-blue-300 flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              title="Zoom arrière"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">zoom_out</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className={`w-12 h-12 rounded-full shadow-lg border border-blue-300 flex items-center justify-center transition-all hover:scale-110 group ${
                isFullscreen ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-blue-400 text-white hover:bg-blue-500'
              }`}
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              <span className={`material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform ${isFullscreen ? 'animate-pulse' : ''}`}>
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>

            <button
              onClick={zoomIn}
              disabled={scale >= 3}
              className="w-12 h-12 rounded-full bg-blue-400 shadow-lg border border-blue-300 flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              title="Zoom avant"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">zoom_in</span>
            </button>

            <button
              onClick={goToNextPage}
              disabled={
                selectedDocument?.numPages
                  ? selectedPageNumber >= selectedDocument.numPages
                  : selectedDocument?.pages?.length
                    ? selectedPageNumber >= selectedDocument.pages.length
                    : false 
              }
              className="w-12 h-12 rounded-full bg-blue-400 shadow-lg border border-blue-300 flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group"
              title="Page suivante"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </main>

    {showSaveModal && (
      <div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={() => setShowSaveModal(false)}
      >
        <div
          className="bg-white dark:bg-dark-bgSecondary rounded-lg p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-3 mb-4">
            <span className="material-symbols-outlined text-[40px] text-[#106EBE] dark:text-blue-400">folder</span>
            <div>
              <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text">Enregistrer dans les bannettes</h2>
              <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary mt-1">
                Sauvegarder l'état actuel pour le recharger plus tard
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Nom de la bannette *
              </label>
              <input
                type="text"
                value={bannetteName}
                onChange={(e) => setBannetteName(e.target.value)}
                placeholder={`Bannette ${new Date().toLocaleDateString('fr-FR')}`}
                className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={bannetteDescription}
                onChange={(e) => setBannetteDescription(e.target.value)}
                placeholder="Description de cette sauvegarde..."
                rows="3"
                className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg">
              <span className="text-sm text-[#605e5c] dark:text-dark-text">
                Pages à sauvegarder :
              </span>
              <span className="font-semibold text-[#106EBE] dark:text-blue-400">
                {orderedPages.length}
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowSaveModal(false)
                setBannetteName('')
                setBannetteDescription('')
              }}
              className="px-4 py-2 text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmSave}
              disabled={isCreating || !bannetteName.trim()}
              className="px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default DocumentViewer
