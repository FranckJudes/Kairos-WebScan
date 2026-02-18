import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configurer le worker PDF.js avec une URL HTTPS complète
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// Désactiver les warnings de pdfjs
pdfjs.GlobalWorkerOptions.verbosity = pdfjs.VerbosityLevel.ERRORS

// Options pour les PDFs - plus permissives pour éviter les erreurs de chargement
const pdfOptions = {
  // Utiliser les CMaps CDN pour éviter les problèmes de chargement
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  disableFontFace: false,
  useWorkerFetch: true,
  useSystemFonts: true,
  // Permettre la récupération des PDFs malformés
  stopAtErrors: false,
  maxImageSize: 1024 * 1024 * 10, // 10MB max par image
  disableCreateObjectURL: false,
  // Ignorer les erreurs de récupération
  ignoreEncryption: true,
}

function PDFViewer({ url, fileName, pageNumber, onPageLoad, scale, onZoomIn, onZoomOut }) {
  const [numPages, setNumPages] = useState(null)
  const [loadError, setLoadError] = useState(null)

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages)
    setLoadError(null)
    if (onPageLoad) {
      onPageLoad(numPages)
    }
  }

  function onDocumentLoadError(error) {
    setLoadError(error.message)
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Document */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-100 dark:bg-dark-bg p-4">
        <Document
          file={url}
          options={pdfOptions}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <span className="material-symbols-outlined text-[48px] text-[#106EBE] dark:text-blue-400 animate-spin">progress_activity</span>
                <p className="text-sm text-[#605e5c] dark:text-dark-text mt-4">Loading PDF...</p>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                <span className="material-symbols-outlined text-[48px] text-red-500 dark:text-red-400">error</span>
                <p className="text-sm text-[#605e5c] dark:text-dark-text mt-4 font-medium">Failed to load PDF</p>
                {loadError && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2 px-4">{loadError}</p>
                )}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-left">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">⚠️ PDF malformé détecté</p>
                  <p className="text-xs text-blue-800 dark:text-blue-400 mb-2">
                    Ce PDF a été généré avec une structure non-standard qui peut causer des erreurs d'affichage.
                  </p>
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Solutions :</p>
                  <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
                    <li>Ré-exportez le PDF depuis l'application source (Word, LibreOffice, etc.)</li>
                    <li>Utilisez "Enregistrer sous" avec les options par défaut</li>
                    <li>Évitez les outils de conversion PDF en ligne de qualité douteuse</li>
                    <li>Ouvrez le PDF dans Adobe Reader et faites "Enregistrer sous"</li>
                  </ul>
                </div>
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
                <span className="material-symbols-outlined text-[32px] text-[#106EBE] dark:text-blue-400 animate-spin">progress_activity</span>
              </div>
            }
          />
        </Document>
      </div>
    </div>
  )
}

export default PDFViewer
