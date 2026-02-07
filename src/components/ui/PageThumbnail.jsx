import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function PageThumbnail({ url, pageNumber, isSelected, onClick, isPdf }) {
  if (!isPdf) {
    return (
      <div
        className={`relative w-24 aspect-[3/4] overflow-hidden rounded-sm cursor-pointer transition-all hover:scale-[1.02] ${
          isSelected ? 'ring-2 ring-[#106EBE] ring-offset-2' : 'border border-[#edebe9]'
        }`}
        onClick={onClick}
      >
        <img
          src={url}
          alt={`Page ${pageNumber}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-medium">
          {pageNumber}
        </div>
        {isSelected && (
          <div className="absolute inset-0 bg-[#106EBE]/5 pointer-events-none"></div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative w-24 aspect-[3/4] overflow-hidden rounded-sm cursor-pointer transition-all hover:scale-[1.02] bg-white ${
        isSelected ? 'ring-2 ring-[#106EBE] ring-offset-2' : 'border border-[#edebe9]'
      }`}
      onClick={onClick}
    >
      <Document
        file={url}
        loading={
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-gray-400 animate-spin">progress_activity</span>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          scale={0.25}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="w-full h-full"
        />
      </Document>
      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-sm font-medium">
        {pageNumber}
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-[#106EBE]/5 pointer-events-none"></div>
      )}
    </div>
  )
}

export default PageThumbnail
