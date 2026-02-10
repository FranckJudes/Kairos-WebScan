import { useState } from 'react'
import { useMobile } from '../../hooks/useMediaQuery'

function NavigationTabs({ activeTab, setActiveTab }) {
  const tabs = ['Scan', 'View']
  const isMobile = useMobile()

  return (
    <nav className="h-9 bg-[#f3f2f1] dark:bg-dark-bgSecondary flex items-end px-2 border-b border-[#edebe9] dark:border-dark-border shrink-0 overflow-x-auto transition-colors duration-200">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-3 md:px-4 h-full flex items-center text-[12px] md:text-[13px] cursor-pointer border-b-2 transition-all whitespace-nowrap min-w-[44px] min-h-[44px] ${
            activeTab === tab
              ? 'border-b-2 border-[#106EBE] bg-white dark:bg-dark-bg font-semibold text-[#106EBE] dark:text-white'
              : 'border-b-2 border-transparent hover:bg-white/50 dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-textSecondary'
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
