import { useState } from 'react'

function NavigationTabs({ activeTab, setActiveTab }) {
  const tabs = ['Scan', 'View']

  return (
    <nav className="h-9 bg-[#f3f2f1] flex items-end px-2 border-b border-[#edebe9] shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-4 h-full flex items-center text-[13px] cursor-pointer border-b-2 transition-all ${
            activeTab === tab
              ? 'border-b-2 border-[#106EBE] bg-white font-semibold text-[#106EBE]'
              : 'border-b-2 border-transparent hover:bg-white/50'
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}

export default NavigationTabs
