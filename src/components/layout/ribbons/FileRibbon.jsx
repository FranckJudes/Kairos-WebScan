function FileRibbon() {
  return (
    <div className="h-24 bg-[#f3f2f1] border-b border-[#edebe9] flex items-stretch py-1.5 px-2 overflow-x-auto custom-scrollbar shrink-0">
      {/* File Operations Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full">
        <div className="flex space-x-1 flex-1 items-center">
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[32px] text-[#106EBE]">note_add</span>
            <span className="text-[11px] mt-1">New</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[32px] text-[#605e5c]">folder_open</span>
            <span className="text-[11px] mt-1">Open</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[32px] text-[#605e5c]">save</span>
            <span className="text-[11px] mt-1">Save</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[32px] text-[#605e5c]">print</span>
            <span className="text-[11px] mt-1">Print</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">File Operations</span>
      </div>

      {/* Recent Files Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full min-w-[200px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] uppercase font-bold tracking-tight">Recent Files</span>
            <div className="space-y-1">
              <div className="text-[11px] text-[#605e5c] hover:bg-white p-1 rounded cursor-pointer">document1.pdf</div>
              <div className="text-[11px] text-[#605e5c] hover:bg-white p-1 rounded cursor-pointer">scan_001.jpg</div>
              <div className="text-[11px] text-[#605e5c] hover:bg-white p-1 rounded cursor-pointer">contract.pdf</div>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Recent</span>
      </div>

      {/* Export Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] h-full">
        <div className="flex space-x-1 flex-1 items-center">
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px] text-[#106EBE]">picture_as_pdf</span>
            <span className="text-[11px] mt-1">PDF</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">image</span>
            <span className="text-[11px] mt-1">Image</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">text_snippet</span>
            <span className="text-[11px] mt-1">Text</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 mt-auto py-0.5">Export</span>
      </div>
    </div>
  )
}

export default FileRibbon
