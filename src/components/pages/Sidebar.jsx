import { useDocuments } from '../../contexts/DocumentsContext'
import FileDropZone from '../ui/FileDropZone'
import PageThumbnail from '../ui/PageThumbnail'

function Sidebar() {
  const {
    documents,
    selectedDocument,
    selectedDocumentId,
    selectedPageNumber,
    setSelectedDocumentId,
    setSelectedPageNumber,
    addDocuments
  } = useDocuments()

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addDocuments(files)
  }

  const numPages = selectedDocument?.numPages || 1
  const isPdf = selectedDocument?.type === 'application/pdf'

  return (
    <aside className="w-64 border-r border-[#edebe9] bg-white flex flex-col shrink-0">
      {/* Document Selector */}
      <div className="p-3 border-b border-[#edebe9] bg-[#faf9f8]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#605e5c] flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-2">folder_open</span>
            Documents ({documents.length})
          </h2>
          <label className="cursor-pointer hover:bg-[#e1dfdd] p-1 rounded transition-colors" title="Add document">
            <span className="material-symbols-outlined text-[18px] text-[#106EBE]">add</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
              multiple
              onChange={handleFileSelect}
            />
          </label>
        </div>

        {documents.length > 0 && (
          <select
            className="w-full text-[11px] py-1.5 px-2 bg-white border border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE]"
            value={selectedDocumentId || ''}
            onChange={(e) => {
              setSelectedDocumentId(Number(e.target.value))
              setSelectedPageNumber(1)
            }}
          >
            <option value="" disabled>Select a document</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {!selectedDocument ? (
          <FileDropZone
            onDrop={addDocuments}
            className="cursor-pointer group"
          >
            <div className="border-2 border-dashed border-[#c8c6c4] rounded-lg p-8 text-center hover:border-[#106EBE] hover:bg-[#f3f2f1] transition-all">
              <span className="material-symbols-outlined text-[c8c6c4] text-4xl mb-2 group-hover:text-[#106EBE] transition-colors">cloud_upload</span>
              <p className="text-[10px] font-medium text-[#c8c6c4] group-hover:text-[#106EBE] transition-colors">DROP FILES HERE</p>
              <p className="text-[9px] text-[#c8c6c4] mt-2">or click to browse</p>
            </div>
          </FileDropZone>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#605e5c] flex items-center">
                <span className="material-symbols-outlined text-[14px] mr-1">view_list</span>
                Pages
              </h3>
              <span className="text-[10px] text-[#605e5c] bg-[#f3f2f1] px-2 py-0.5 rounded-full">
                {numPages} {numPages === 1 ? 'page' : 'pages'}
              </span>
            </div>

            <div className="space-y-3">
              {selectedDocument.pages ? (
                // Document scanné avec des pages multiples (toujours des images)
                selectedDocument.pages.map((page) => (
                  <div
                    key={page.pageNumber}
                    className="space-y-1"
                  >
                    <PageThumbnail
                      url={page.url}
                      pageNumber={page.pageNumber}
                      isSelected={selectedPageNumber === page.pageNumber}
                      onClick={() => setSelectedPageNumber(page.pageNumber)}
                      isPdf={false}
                    />
                  </div>
                ))
              ) : (
                // Document classique (PDF ou image)
                Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div
                    key={pageNum}
                    className="space-y-1"
                  >
                    <PageThumbnail
                      url={selectedDocument.url}
                      pageNumber={pageNum}
                      isSelected={selectedPageNumber === pageNum}
                      onClick={() => setSelectedPageNumber(pageNum)}
                      isPdf={isPdf}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Page Info Footer */}
      {selectedDocument && (
        <div className="p-3 bg-[#faf9f8] border-t border-[#edebe9]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#605e5c]">Current Page</span>
            <span className="font-bold text-[#106EBE]">
              {selectedPageNumber} / {numPages}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
