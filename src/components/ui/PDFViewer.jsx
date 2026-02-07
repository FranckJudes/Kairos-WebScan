import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function PDFViewer({ url, fileName, pageNumber, onPageLoad, scale, onZoomIn, onZoomOut }) {
  const [numPages, setNumPages] = useState(null)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    if (onPageLoad) {
      onPageLoad(numPages)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Document */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-100 p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-[#106EBE] animate-spin">progress_activity</span>
                <p className="text-sm text-[#605e5c] mt-4">Loading PDF...</p>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-red-500">error</span>
                <p className="text-sm text-[#605e5c] mt-4">Failed to load PDF</p>
              </div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-lg"
            loading={
              <div className="flex items-center justify-center min-h-[400px]">
                <span className="material-symbols-outlined text-[32px] text-[#106EBE] animate-spin">progress_activity</span>
              </div>
            }
          />
        </Document>
      </div>
    </div>
  )
}

export default PDFViewer
