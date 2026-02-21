import { useState, createContext, useContext } from 'react'

// Context pour gérer l'état de la sidebar de compte
const AccountSidebarContext = createContext({
  isAccountSidebarOpen: false,
  initialSection: 'profile',
  openAccountSidebar: () => { },
  closeAccountSidebar: () => { },
  toggleAccountSidebar: () => { },
})

export const useAccountSidebar = () => useContext(AccountSidebarContext)

export const AccountSidebarProvider = ({ children }) => {
  const [isAccountSidebarOpen, setIsAccountSidebarOpen] = useState(false)
  const [initialSection, setInitialSection] = useState('profile')

  const openAccountSidebar = (section = 'profile') => {
    setInitialSection(section)
    setIsAccountSidebarOpen(true)
  }
  const closeAccountSidebar = () => setIsAccountSidebarOpen(false)
  const toggleAccountSidebar = (section = 'profile') => {
    setInitialSection(section)
    setIsAccountSidebarOpen(prev => !prev)
  }

  return (
    <AccountSidebarContext.Provider
      value={{
        isAccountSidebarOpen,
        initialSection,
        openAccountSidebar,
        closeAccountSidebar,
        toggleAccountSidebar,
      }}
    >
      {children}
    </AccountSidebarContext.Provider>
  )
}
