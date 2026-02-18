import { Document, Page, pdfjs } from 'react-pdf'
import { useState } from 'react'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function PageThumbnail({ url, pageNumber, originalPageNumber, isSelected, onClick, isPdf, hasCheckbox }) {
  const [pageDimensions, setPageDimensions] = useState(null)

  const displayPageNumber = isPdf && originalPageNumber !== undefined && originalPageNumber !== pageNumber ? originalPageNumber : pageNumber
  const labelPageNumber = pageNumber // Pour l'affichage du numéro, utiliser le numéro logique

  if (!isPdf) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-sm cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-center bg-gray-100 dark:bg-dark-bgTertiary ${
          isSelected ? 'ring-2 ring-[#106EBE] dark:ring-blue-400 ring-offset-2 dark:ring-offset-dark-bg' : 'border border-[#edebe9] dark:border-dark-border'
        }`}
        onClick={onClick}
        style={{ minHeight: '100px' }}
      >
        <div className="p-2 w-full h-full">
          <img
            src={url}
            alt={`Page ${labelPageNumber}`}
            className="w-full h-auto object-contain"
          />
        </div>
        <div className={`absolute bottom-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-medium ${hasCheckbox ? 'left-8' : 'left-1'}`}>
          {labelPageNumber}
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
      <div className="p-2 w-full h-full">
        <Document
          file={url}
          loading={
            <div className="w-full h-full bg-gray-100 dark:bg-dark-bgTertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-gray-400 dark:text-dark-textTertiary animate-spin">progress_activity</span>
            </div>
          }
        >
          <Page
            pageNumber={displayPageNumber}
            scale={0.2}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="w-full h-auto"
            onLoadSuccess={(page) => {
              const viewport = page.getViewport({ scale: 1 })
              setPageDimensions({ width: viewport.width, height: viewport.height })
            }}
          />
        </Document>
      </div>
      <div className={`absolute bottom-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-medium ${hasCheckbox ? 'left-8' : 'left-1'}`}>
        {labelPageNumber}
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-[#106EBE]/5 dark:bg-blue-400/5 pointer-events-none"></div>
      )}
    </div>
  )
}

export default PageThumbnail
