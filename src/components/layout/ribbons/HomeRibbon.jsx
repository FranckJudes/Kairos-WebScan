import { useState, useRef } from 'react'
import { useDocuments } from '../../../contexts/DocumentsContext'

function HomeRibbon() {
  const [dpi, setDpi] = useState('300 DPI')
  const [colorMode, setColorMode] = useState('COL')
  const [ocrEnabled, setOcrEnabled] = useState(true)
  const [language, setLanguage] = useState('English (US)')
  const fileInputRef = useRef(null)
  const { addDocuments } = useDocuments()

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addDocuments(files)
    e.target.value = '' // Reset input
  }

  return (
    <div className="h-24 bg-[#f3f2f1] border-b border-[#edebe9] flex items-stretch py-1.5 px-2 overflow-x-auto custom-scrollbar shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
        multiple
        onChange={handleFileSelect}
      />

      {/* Acquisition Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full">
        <div className="flex space-x-1 flex-1 items-center">
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[32px] text-[#106EBE]">scanner</span>
            <span className="text-[11px] mt-1">Scan</span>
          </button>
          <button
            className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]"
            onClick={handleImportClick}
          >
            <span className="material-symbols-outlined text-[32px] text-[#605e5c]">file_upload</span>
            <span className="text-[11px] mt-1">Import</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Acquisition</span>
      </div>

      {/* Image Properties Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[220px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#605e5c]">DPI</span>
              <select
                className="text-[11px] py-0.5 px-2 bg-white border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE] min-w-[100px]"
                value={dpi}
                onChange={(e) => setDpi(e.target.value)}
              >
                <option>300 DPI</option>
                <option>600 DPI</option>
                <option>150 DPI</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#605e5c]">Color</span>
              <div className="flex bg-white rounded border border-[#edebe9] p-0.5">
                <button
                  className={`px-2 py-0.5 text-[10px] rounded-sm font-medium ${
                    colorMode === 'COL'
                      ? 'bg-[#106EBE] text-white'
                      : 'text-[#605e5c] hover:bg-[#e1dfdd]'
                  }`}
                  onClick={() => setColorMode('COL')}
                >
                  COL
                </button>
                <button
                  className={`px-2 py-0.5 text-[10px] rounded-sm font-medium ${
                    colorMode === 'GRY'
                      ? 'bg-[#106EBE] text-white'
                      : 'text-[#605e5c] hover:bg-[#e1dfdd]'
                  }`}
                  onClick={() => setColorMode('GRY')}
                >
                  GRY
                </button>
              </div>
            </div>
          </div>
          <div className="h-12 w-px bg-[#edebe9]"></div>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">auto_fix</span>
            <span className="text-[11px] mt-1">Auto</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Image Properties</span>
      </div>

      {/* OCR Settings Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[200px]">
        <div className="flex flex-1 items-center space-x-4 px-2">
          <div className="flex flex-col items-center">
            <div className="relative inline-flex items-center cursor-pointer mb-1">
              <input
                checked={ocrEnabled}
                className="sr-only peer"
                type="checkbox"
                onChange={() => setOcrEnabled(!ocrEnabled)}
              />
              <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#106EBE]"></div>
            </div>
            <span className="text-[10px] font-medium text-[#605e5c]">OCR</span>
          </div>
          <div className="flex flex-col space-y-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Language</span>
            <select
              className="text-[11px] py-0.5 px-2 bg-white border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE]"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>English (US)</option>
              <option>French (FR)</option>
              <option>Spanish (ES)</option>
            </select>
          </div>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">translate</span>
            <span className="text-[11px] mt-1">Detect</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">OCR Settings</span>
      </div>

      {/* Edit & View Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full">
        <div className="flex space-x-1 flex-1 items-center">
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">zoom_in</span>
            <span className="text-[11px] mt-1">Zoom</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">rotate_right</span>
            <span className="text-[11px] mt-1">Rotate</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">crop</span>
            <span className="text-[11px] mt-1">Crop</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Edit & View</span>
      </div>
    </div>
  )
}

export default HomeRibbon
