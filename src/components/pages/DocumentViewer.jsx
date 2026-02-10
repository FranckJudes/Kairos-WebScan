import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import FileDropZone from '../ui/FileDropZone'
import PDFViewer from '../ui/PDFViewer'
import { useMobile } from '../../hooks/useMediaQuery'

function DocumentViewer() {
  const navigate = useNavigate()
  const { selectedDocument, addDocuments, selectedPageNumber, updateDocumentNumPages } = useDocuments()
  const [scale, setScale] = useState(1.0)
  const isMobile = useMobile()

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

  const goToOrganize = () => {
    navigate('/organize')
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
              <p>Maximum file size: 50 MB</p>
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

  // Un vrai PDF est un document qui n'a pas de pages séparées mais est de type PDF
  const isPdf = selectedDocument.type === 'application/pdf' && !selectedDocument.pages
  // Un document scanné a des pages séparées
  const hasMultiplePages = selectedDocument.pages && selectedDocument.pages.length > 1
  const numPages = selectedDocument.numPages || 1

  // Récupérer l'URL de la page courante
  const currentPageUrl = hasMultiplePages
    ? selectedDocument.pages.find(p => p.pageNumber === selectedPageNumber)?.url || selectedDocument.pages[0]?.url
    : selectedDocument.url

  return (
    <main className="flex-1 relative overflow-hidden flex flex-col">
      {/* Document Header */}
      <div className="p-2 md:p-3 border-b border-[#edebe9] dark:border-dark-border bg-[#faf9f8] dark:bg-dark-bgSecondary flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0 shrink-0 transition-colors duration-200">
        {/* Document info - top row on mobile */}
        <div className="flex items-center justify-between w-full md:w-auto md:space-x-3">
          <div className="flex items-center space-x-2 min-w-0">
            <h2 className="text-xs md:text-sm font-semibold text-[#605e5c] dark:text-dark-text truncate max-w-[150px] md:max-w-md">{selectedDocument.name}</h2>
            <span className="text-[9px] md:text-[10px] text-[#c8c6c4] dark:text-dark-textTertiary hidden sm:inline">
              {(selectedDocument.size / 1024).toFixed(1)} KB • {new Date(selectedDocument.createdAt).toLocaleDateString()}
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] font-medium text-[#605e5c] dark:text-dark-text uppercase tracking-wider bg-[#f3f2f1] dark:bg-dark-bgTertiary px-2 md:px-3 py-1 rounded-full whitespace-nowrap">
            {selectedDocument.type.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>
        </div>

        {/* Toolbar - scrollable on mobile, row on desktop */}
        <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          <div className="flex items-center space-x-1 md:space-x-2 shrink-0">
            {(isPdf || hasMultiplePages) && (
              <>
                <span className="text-[9px] md:text-[10px] text-[#605e5c] dark:text-dark-text whitespace-nowrap">Pg {selectedPageNumber}/{numPages}</span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                    className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Zoom out"
                  >
                    <span className="material-symbols-outlined text-[20px] md:text-[18px]">zoom_out</span>
                  </button>
                  <span className="text-[10px] text-[#605e5c] dark:text-dark-text min-w-[40px] md:min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
                  <button
                    onClick={zoomIn}
                    disabled={scale >= 3}
                    className="p-1.5 md:p-1 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Zoom in"
                  >
                    <span className="material-symbols-outlined text-[20px] md:text-[18px]">zoom_in</span>
                  </button>
                  <button
                    onClick={resetZoom}
                    className="p-1.5 md:p-1 px-2 md:px-2 py-0.5 text-[10px] bg-white dark:bg-dark-bg border border-[#edebe9] dark:border-dark-border rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <span className="hidden md:inline">Reset</span>
                    <span className="material-symbols-outlined md:hidden text-[18px]">restart</span>
                  </button>
                </div>
              </>
            )}

            {/* Bouton Passer à la découpe */}
            <button
              onClick={goToOrganize}
              className="bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded shadow-lg flex items-center space-x-1 md:space-x-2 transition-all text-xs md:text-sm font-medium min-w-[44px] min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px] md:text-[18px]">content_cut</span>
              <span className="hidden sm:inline">Découpe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-dark-bg">
        {isPdf ? (
          <PDFViewer
            url={selectedDocument.url}
            fileName={selectedDocument.name}
            pageNumber={selectedPageNumber}
            onPageLoad={handlePageLoad}
            scale={scale}
          />
        ) : (
          <div className="p-4 md:p-12 flex justify-center">
            <div className="relative w-full max-w-[850px] bg-white dark:bg-dark-bgSecondary document-view h-fit mb-8 md:mb-12 overflow-hidden transition-colors duration-200">
              <img
                src={currentPageUrl}
                alt={`${selectedDocument.name} - Page ${selectedPageNumber}`}
                className="w-full h-auto object-contain"
              />

              {/* Document Corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#106EBE] dark:border-blue-400 pointer-events-none"></div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      {/* <div className="fixed bottom-10 right-10 flex flex-col items-end space-y-4 z-10">
        <div className="flex flex-col space-y-2">
          <button className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#edebe9] flex items-center justify-center text-blue-600 hover:scale-110 transition-transform" title="Download">
            <span className="material-symbols-outlined">download</span>
          </button>
          <button className="w-12 h-12 bg-white rounded-full shadow-lg border border-[#edebe9] flex items-center justify-center text-sky-500 hover:scale-110 transition-transform" title="Share">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
        <button className="bg-[#106EBE] hover:bg-[#005a9e] text-white px-8 py-4 rounded-full shadow-xl flex items-center space-x-3 transition-all transform hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined">picture_as_pdf</span>
          <span className="font-semibold tracking-wide">EXPORT AS PDF</span>
        </button>
      </div> */}
    </main>
  )
}

export default DocumentViewer
