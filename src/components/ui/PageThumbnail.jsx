import { Document, Page, pdfjs } from 'react-pdf'
import { useState } from 'react'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function PageThumbnail({ url, pageNumber, isSelected, onClick, isPdf }) {
  const [pageDimensions, setPageDimensions] = useState(null)

  if (!isPdf) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-sm cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center bg-gray-100 dark:bg-dark-bgTertiary ${
          isSelected ? 'ring-2 ring-[#106EBE] dark:ring-blue-400 ring-offset-2 dark:ring-offset-dark-bg' : 'border border-[#edebe9] dark:border-dark-border'
        }`}
        onClick={onClick}
        style={{ minHeight: '100px' }}
      >
        <img
          src={url}
          alt={`Page ${pageNumber}`}
          className="w-full h-auto object-contain"
        />
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-medium">
          {pageNumber}
        </div>
        {isSelected && (
          <div className="absolute inset-0 bg-[#106EBE]/5 dark:bg-blue-400/5 pointer-events-none"></div>
        )}
      </div>
    )
  }

  // Calculer la hauteur du conteneur en fonction du ratio de la page
  const containerHeight = pageDimensions
    ? Math.min(170, Math.max(100, (pageDimensions.height / pageDimensions.width) * 200))
    : 130

  return (
    <div
      className={`relative w-full overflow-hidden rounded-sm cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center bg-white dark:bg-dark-bgSecondary ${
        isSelected ? 'ring-2 ring-[#106EBE] dark:ring-blue-400 ring-offset-2 dark:ring-offset-dark-bg' : 'border border-[#edebe9] dark:border-dark-border'
      }`}
      onClick={onClick}
      style={{ height: containerHeight }}
    >
      <Document
        file={url}
        loading={
          <div className="w-full h-full bg-gray-100 dark:bg-dark-bgTertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-gray-400 dark:text-dark-textTertiary animate-spin">progress_activity</span>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          scale={0.45}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="w-full h-auto"
          onLoadSuccess={(page) => {
            const viewport = page.getViewport({ scale: 1 })
            setPageDimensions({ width: viewport.width, height: viewport.height })
          }}
        />
      </Document>
      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-medium">
        {pageNumber}
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-[#106EBE]/5 dark:bg-blue-400/5 pointer-events-none"></div>
      )}
    </div>
  )
}

export default PageThumbnail
