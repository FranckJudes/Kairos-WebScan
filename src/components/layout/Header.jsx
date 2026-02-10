import { useState } from 'react'
import { HamburgerButton } from '../ui/MobileSidebar'
import DarkModeToggle from '../ui/DarkModeToggle'
import { useDarkMode } from '../../hooks/useDarkMode'

function Header({ onToggleSidebar, isSidebarOpen }) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const { isDarkMode } = useDarkMode()

  return (
    <header className="h-10 bg-[#106EBE] flex items-center justify-between px-3 shrink-0 text-white z-50 dark:bg-[#0d4a8e]">
      <div className="flex items-center space-x-3">
        {/* Bouton hamburger visible uniquement sur mobile */}
        <HamburgerButton onClick={onToggleSidebar} isOpen={isSidebarOpen} />

        <span className="material-symbols-outlined text-[20px]">description</span>
        <span className="font-semibold text-sm hidden xs:inline sm:inline">Kairos WebScan</span>
        <div className="h-4 w-px bg-white/20 mx-2 hidden sm:block"></div>
        <div className="flex items-center space-x-1 hidden sm:flex">
          <button className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">save</span>
          </button>
          <button className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">undo</span>
          </button>
          <button className="p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">redo</span>
          </button>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Barre de recherche - cachée sur très petits écrans, expandable sur mobile */}
        <div className={`flex items-center bg-white/10 rounded px-2 py-1 h-7 transition-all duration-300 ${isSearchExpanded ? 'w-auto' : 'w-32'} hidden xs:flex`}>
          <span className="material-symbols-outlined text-[16px] mr-2">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-xs p-0 w-20 xs:w-24 sm:w-40 placeholder-white/60"
            placeholder="Search..."
            type="text"
            onFocus={() => setIsSearchExpanded(true)}
            onBlur={() => setIsSearchExpanded(false)}
          />
        </div>
        {/* Bouton de recherche pour très petits écrans */}
        <button className="xs:hidden p-1.5 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px]">search</span>
        </button>
        {/* Bouton toggle dark mode */}
        <DarkModeToggle />
        {/* User avatar avec taille responsive */}
        <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-white/20 overflow-hidden border border-white/30">
          <img
            alt="User"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl3E7htN3y7W1dQg533vblGrq_JbzH3MEU6f2LWX2-Gvfw-dFDzNCbxXucuiifw75esq6EjY6QbpA4qVgQOqzHVC6pD6AgRpnpmkmBYO52JuHIcjSQro9yWbH4yejREHxLrVqvgMMfnN7jiqx9MDFlFuC_llAVQwDLbi4wSwf-cK3LCdGfCbHVE4hpiio7sHHkGC59HYdKcS9PltSWguWqd61efj_gaTdwMQE3BSjdinZpdbyoDVbGI4ILSwRvMVvSz-i386qZsZLx"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
