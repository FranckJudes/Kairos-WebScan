import { useState } from 'react'

function OcrRibbon() {
  const [ocrEnabled, setOcrEnabled] = useState(true)
  const [language, setLanguage] = useState('English (US)')
  const [outputFormat, setOutputFormat] = useState('PDF')
  const [accuracy, setAccuracy] = useState('Standard')

  return (
    <div className="h-24 bg-[#f3f2f1] border-b border-[#edebe9] flex items-stretch py-1.5 px-2 overflow-x-auto custom-scrollbar shrink-0">
      {/* OCR Toggle Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[150px]">
        <div className="flex flex-1 items-center justify-center px-2">
          <div className="flex flex-col items-center">
            <div className="relative inline-flex items-center cursor-pointer mb-2">
              <input
                checked={ocrEnabled}
                className="sr-only peer"
                type="checkbox"
                onChange={() => setOcrEnabled(!ocrEnabled)}
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#106EBE]"></div>
            </div>
            <span className="text-[12px] font-bold text-[#605e5c]">ENABLE OCR</span>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Status</span>
      </div>

      {/* Language Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[200px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Recognition Language</span>
            <select
              className="text-[11px] py-1 px-2 bg-white border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE] w-full"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>French (FR)</option>
              <option>Spanish (ES)</option>
              <option>German (DE)</option>
              <option>Italian (IT)</option>
              <option>Portuguese (PT)</option>
              <option>Dutch (NL)</option>
              <option>Multi-language</option>
            </select>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Language</span>
      </div>

      {/* Output Format Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[180px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Output Format</span>
            <select
              className="text-[11px] py-1 px-2 bg-white border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE] w-full"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <option>PDF (Searchable)</option>
              <option>PDF (Image over Text)</option>
              <option>Word (DOCX)</option>
              <option>Plain Text (TXT)</option>
              <option>RTF</option>
            </select>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Format</span>
      </div>

      {/* Accuracy Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[180px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Accuracy Mode</span>
            <select
              className="text-[11px] py-1 px-2 bg-white border-[#edebe9] rounded focus:ring-1 focus:ring-[#106EBE] w-full"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
            >
              <option>Fast (Draft)</option>
              <option>Standard</option>
              <option>High Quality</option>
              <option>Precision (Slow)</option>
            </select>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Quality</span>
      </div>

      {/* OCR Actions Group */}
      <div className="flex flex-col items-center px-3 h-full">
        <div className="flex space-x-2 flex-1 items-center">
          <button className="bg-[#106EBE] hover:bg-[#005a9e] text-white px-6 py-3 rounded shadow-lg flex items-center space-x-2 transition-all" disabled={!ocrEnabled}>
            <span className="material-symbols-outlined">text_fields</span>
            <span className="font-semibold text-[12px]">RUN OCR</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">spellcheck</span>
            <span className="text-[11px] mt-1">Verify</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">translate</span>
            <span className="text-[11px] mt-1">Translate</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Actions</span>
      </div>
    </div>
  )
}

export default OcrRibbon
