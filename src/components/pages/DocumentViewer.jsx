import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import FileDropZone from '../ui/FileDropZone'
import PDFViewer from '../ui/PDFViewer'

function DocumentViewer() {
  const navigate = useNavigate()
  const { selectedDocument, addDocuments, selectedPageNumber, updateDocumentNumPages } = useDocuments()
  const [scale, setScale] = useState(1.0)

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
      <main className="flex-1 relative overflow-auto p-12 flex justify-center items-center custom-scrollbar">
        <FileDropZone
          onDrop={addDocuments}
          className="w-full max-w-2xl"
        >
          <div className="border-2 border-dashed border-[#c8c6c4] rounded-lg p-16 text-center hover:border-[#106EBE] hover:bg-[#f3f2f1] transition-all cursor-pointer bg-white">
            <span className="material-symbols-outlined text-[80px] text-[#106EBE] mb-6">cloud_upload</span>
            <h2 className="text-2xl font-bold text-[#605e5c] mb-4">Import your documents</h2>
            <p className="text-sm text-[#605e5c] mb-6 max-w-md mx-auto">
              Drag & drop files here, or click to browse
            </p>
            <div className="space-y-2 text-xs text-[#605e5c] mb-6">
              <p>Supported formats: PDF, JPG, PNG, TIFF, BMP, WEBP</p>
              <p>Maximum file size: 50 MB</p>
            </div>
            <label className="inline-flex items-center space-x-2 bg-[#106EBE] hover:bg-[#005a9e] text-white px-8 py-4 rounded-full shadow-lg cursor-pointer transition-all transform hover:scale-105">
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
      <div className="p-3 border-b border-[#edebe9] bg-[#faf9f8] flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-sm font-semibold text-[#605e5c] truncate max-w-md">{selectedDocument.name}</h2>
          <span className="text-[10px] text-[#c8c6c4]">
            {(selectedDocument.size / 1024).toFixed(1)} KB • {new Date(selectedDocument.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-[10px] font-medium text-[#605e5c] uppercase tracking-wider bg-[#f3f2f1] px-3 py-1 rounded-full">
            {selectedDocument.type.split('/')[1]?.toUpperCase() || 'FILE'}
          </span>

          {(isPdf || hasMultiplePages) && (
            <>
              <span className="text-[10px] text-[#605e5c]">Page {selectedPageNumber} / {numPages}</span>

              <div className="flex items-center space-x-1">
                <button
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="p-1 rounded hover:bg-[#e1dfdd] disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <span className="text-[10px] text-[#605e5c] min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
                <button
                  onClick={zoomIn}
                  disabled={scale >= 3}
                  className="p-1 rounded hover:bg-[#e1dfdd] disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <button
                  onClick={resetZoom}
                  className="ml-1 px-2 py-0.5 text-[10px] bg-white border border-[#edebe9] rounded hover:bg-[#e1dfdd]"
                >
                  Reset
                </button>
              </div>
            </>
          )}

          {/* Bouton Passer à la découpe */}
          <button
            onClick={goToOrganize}
            className="bg-[#106EBE] hover:bg-[#005a9e] text-white px-4 py-2 rounded shadow-lg flex items-center space-x-2 transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">content_cut</span>
            <span>Passer à la découpe</span>
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {isPdf ? (
          <PDFViewer
            url={selectedDocument.url}
            fileName={selectedDocument.name}
            pageNumber={selectedPageNumber}
            onPageLoad={handlePageLoad}
            scale={scale}
          />
        ) : (
          <div className="p-12 flex justify-center">
            <div className="relative w-full max-w-[850px] bg-white document-view h-fit mb-12 overflow-hidden">
              <img
                src={currentPageUrl}
                alt={`${selectedDocument.name} - Page ${selectedPageNumber}`}
                className="w-full h-auto object-contain"
              />

              {/* Document Corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#106EBE] pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#106EBE] pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#106EBE] pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#106EBE] pointer-events-none"></div>
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
