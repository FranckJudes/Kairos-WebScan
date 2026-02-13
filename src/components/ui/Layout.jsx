import { useState, createContext, useContext } from 'react'
import Header from '../layout/Header'
import UnifiedRibbon from '../layout/ribbons/UnifiedRibbon'
import SubNavigation from '../layout/SubNavigation'
import Footer from '../layout/Footer'
import { Outlet } from 'react-router-dom'

// Context pour gérer l'état de la sidebar mobile
const SidebarContext = createContext({
  isSidebarOpen: false,
  toggleSidebar: () => { },
  closeSidebar: () => { }
})

export const useSidebar = () => useContext(SidebarContext)

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)

  const sidebarContextValue = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar
  }

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="h-screen flex flex-col bg-white dark:bg-dark-bg text-[#605e5c] dark:text-dark-text overflow-hidden transition-colors duration-200">
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <UnifiedRibbon />
        <SubNavigation />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
        <Footer />
      </div>
    </SidebarContext.Provider>
  )
}

export default Layout
