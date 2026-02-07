import { useState } from 'react'
import { useDocuments } from '../../../contexts/DocumentsContext'

function ViewRibbon() {
  const [zoomLevel, setZoomLevel] = useState('100%')
  const [viewMode, setViewMode] = useState('Single Page')
  const [rotation, setRotation] = useState(0)
  const { documents, selectedDocumentId, setSelectedDocumentId } = useDocuments()

  const currentIndex = documents.findIndex((doc) => doc.id === selectedDocumentId)
  const totalDocs = documents.length

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedDocumentId(documents[currentIndex - 1].id)
    }
  }

  const goToNext = () => {
    if (currentIndex < totalDocs - 1) {
      setSelectedDocumentId(documents[currentIndex + 1].id)
    }
  }

  const goToFirst = () => {
    if (documents.length > 0) {
      setSelectedDocumentId(documents[0].id)
    }
  }

  const goToLast = () => {
    if (documents.length > 0) {
      setSelectedDocumentId(documents[documents.length - 1].id)
    }
  }

  return (
    <div className="h-24 bg-[#f3f2f1] border-b border-[#edebe9] flex items-stretch py-1.5 px-2 overflow-x-auto custom-scrollbar shrink-0">
      {/* Zoom Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[220px]">
        <div className="flex flex-1 items-center space-x-2 px-2 w-full">
          <button className="p-2 rounded hover:bg-[#e1dfdd] transition-colors" onClick={() => setZoomLevel(prev => Math.max(25, parseInt(prev) - 25) + '%')}>
            <span className="material-symbols-outlined text-[24px]">zoom_out</span>
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Zoom</span>
            <select
              className="text-[11px] py-0.5 px-2 bg-white border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE] w-full"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value)}
            >
              <option>25%</option>
              <option>50%</option>
              <option>75%</option>
              <option>100%</option>
              <option>125%</option>
              <option>150%</option>
              <option>200%</option>
              <option>Fit Width</option>
              <option>Fit Page</option>
            </select>
          </div>
          <button className="p-2 rounded hover:bg-[#e1dfdd] transition-colors" onClick={() => setZoomLevel(prev => Math.min(400, parseInt(prev) + 25) + '%')}>
            <span className="material-symbols-outlined text-[24px]">zoom_in</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Zoom</span>
      </div>

      {/* View Mode Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[200px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">View Mode</span>
            <div className="flex bg-white rounded border border-[#edebe9] p-0.5">
              <button
                className={`flex-1 px-2 py-0.5 text-[10px] rounded-sm font-medium flex items-center justify-center ${
                  viewMode === 'Single Page'
                    ? 'bg-[#106EBE] text-white'
                    : 'text-[#605e5c] hover:bg-[#e1dfdd]'
                }`}
                onClick={() => setViewMode('Single Page')}
              >
                <span className="material-symbols-outlined text-[14px] mr-1">description</span>
                1
              </button>
              <button
                className={`flex-1 px-2 py-0.5 text-[10px] rounded-sm font-medium flex items-center justify-center ${
                  viewMode === 'Facing'
                    ? 'bg-[#106EBE] text-white'
                    : 'text-[#605e5c] hover:bg-[#e1dfdd]'
                }`}
                onClick={() => setViewMode('Facing')}
              >
                <span className="material-symbols-outlined text-[14px] mr-1">book_2</span>
                2
              </button>
              <button
                className={`flex-1 px-2 py-0.5 text-[10px] rounded-sm font-medium flex items-center justify-center ${
                  viewMode === 'Continuous'
                    ? 'bg-[#106EBE] text-white'
                    : 'text-[#605e5c] hover:bg-[#e1dfdd]'
                }`}
                onClick={() => setViewMode('Continuous')}
              >
                <span className="material-symbols-outlined text-[14px] mr-1">auto_stories</span>
                ∞
              </button>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Layout</span>
      </div>

      {/* Rotation Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[180px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Rotation: {rotation}°</span>
            <div className="flex space-x-1">
              <button
                className="flex-1 px-3 py-1 bg-white border border-[#edebe9] rounded hover:bg-[#e1dfdd] transition-colors text-[10px] font-medium"
                onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
              >
                -90°
              </button>
              <button
                className="flex-1 px-3 py-1 bg-white border border-[#edebe9] rounded hover:bg-[#e1dfdd] transition-colors text-[10px] font-medium"
                onClick={() => setRotation(prev => (prev + 90) % 360)}
              >
                +90°
              </button>
              <button
                className="flex-1 px-3 py-1 bg-white border border-[#edebe9] rounded hover:bg-[#e1dfdd] transition-colors text-[10px] font-medium"
                onClick={() => setRotation(0)}
              >
                0°
              </button>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Rotate</span>
      </div>

      {/* Display Options Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[200px]">
        <div className="flex flex-1 items-center space-x-2 px-2 w-full">
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">invert_colors</span>
            <span className="text-[11px] mt-1">Invert</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">contrast</span>
            <span className="text-[11px] mt-1">Contrast</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">brightness_6</span>
            <span className="text-[11px] mt-1">Bright</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Display</span>
      </div>

      {/* Navigation Group */}
      <div className="flex flex-col items-center px-3 h-full">
        <div className="flex space-x-1 flex-1 items-center">
          <button
            className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={goToFirst}
            disabled={totalDocs === 0 || currentIndex === 0}
          >
            <span className="material-symbols-outlined text-[24px]">first_page</span>
            <span className="text-[11px] mt-1">First</span>
          </button>
          <button
            className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={goToPrevious}
            disabled={totalDocs === 0 || currentIndex === 0}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
            <span className="text-[11px] mt-1">Prev</span>
          </button>
          <div className="flex flex-col items-center justify-center px-2 min-w-[80px]">
            <span className="text-[12px] font-medium text-[#605e5c]">Document</span>
            <span className="text-[14px] font-bold text-[#106EBE]">
              {totalDocs === 0 ? '0 / 0' : `${currentIndex + 1} / ${totalDocs}`}
            </span>
          </div>
          <button
            className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={goToNext}
            disabled={totalDocs === 0 || currentIndex === totalDocs - 1}
          >
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
            <span className="text-[11px] mt-1">Next</span>
          </button>
          <button
            className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={goToLast}
            disabled={totalDocs === 0 || currentIndex === totalDocs - 1}
          >
            <span className="material-symbols-outlined text-[24px]">last_page</span>
            <span className="text-[11px] mt-1">Last</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Navigate</span>
      </div>
    </div>
  )
}

export default ViewRibbon
