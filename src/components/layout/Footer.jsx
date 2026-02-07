import { useDocuments } from '../../contexts/DocumentsContext'

function Footer() {
  const { documents, selectedDocument } = useDocuments()

  return (
    <footer className="h-6 bg-[#106EBE] flex items-center px-3 justify-between text-[10px] text-white font-medium shrink-0">
      <div className="flex items-center space-x-4">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 shadow-sm"></span>
          SCANNER: EPSON-WF-2830 READY
        </span>
        <span className="opacity-40">|</span>
        <span>{selectedDocument ? 'DOCUMENT LOADED' : 'NO DOCUMENT'}</span>
      </div>
      <div className="flex items-center space-x-4">
        {selectedDocument && (
          <>
            <span className="font-bold tracking-widest bg-white/20 px-2 rounded-sm uppercase">
              {selectedDocument.type.split('/')[1]?.toUpperCase() || 'FILE'}
            </span>
            <span className="opacity-40">|</span>
            <span>
              {(selectedDocument.size / 1024).toFixed(1)} KB
            </span>
            <span className="opacity-40">|</span>
          </>
        )}
        <span>ZOOM: 100%</span>
      </div>
    </footer>
  )
}

export default Footer
