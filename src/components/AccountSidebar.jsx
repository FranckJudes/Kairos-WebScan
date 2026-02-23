import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAccountSidebar } from '../contexts/AccountSidebarContext'
import useUserProfile from '../hooks/useUserProfile'
import useTranslation from '../hooks/useTranslation'
import {
  PersonRounded,
  LockRounded,
  CenterFocusStrongRounded,
  FolderRounded,
  CloudRounded,
  SettingsRounded,
  HelpOutlineRounded,
  TuneRounded,
  LogoutRounded,
  CloseRounded,
  MenuRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'

// Sous-composants pour chaque section
import AccountProfile from './pages/account/AccountProfile'
import AccountLicense from './pages/account/AccountLicense'
import AccountDocuments from './pages/account/AccountDocuments'
import AccountPreferences from './pages/account/AccountPreferences'
import AccountSecurity from './pages/account/AccountSecurity'
import AccountStorage from './pages/account/AccountStorage'
import AccountHelp from './pages/account/AccountHelp'
import AccountSettings from './pages/account/AccountSettings'

const AccountSidebar = () => {
  const { logout } = useAuth()
  const { t } = useTranslation('fr')
  const { isAccountSidebarOpen, closeAccountSidebar, initialSection } = useAccountSidebar()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Récupérer la section depuis le contexte lors de l'ouverture
  useEffect(() => {
    if (isAccountSidebarOpen) {
      setActiveSection(initialSection)
    }
  }, [isAccountSidebarOpen, initialSection])

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeAccountSidebar()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
    setIsMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    closeAccountSidebar()
    toast.success(t('menu.logoutSuccess'))
  }

  return (
    <>
      {/* Backdrop flouté */}
      {isAccountSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={closeAccountSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-1/2 min-w-[320px] max-w-[800px] bg-white dark:bg-dark-bgSecondary z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isAccountSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#edebe9] dark:border-dark-border bg-gradient-to-r from-[#106EBE] to-blue-600 dark:from-blue-700 dark:to-blue-800">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-lg">{t('page.loading')}</h2>
            <button
              onClick={closeAccountSidebar}
              className="text-white/80 hover:text-white rounded-full p-2 transition-colors"
              aria-label="Fermer"
            >
              <CloseRounded className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Profil utilisateur en haut de sidebar */}
        <div className="flex items-center gap-3 p-4">
          <div className={`w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg overflow-hidden`}>
            {t('menu.user')}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {t('page.loading')}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {[
            { id: 'profile', label: t('menu.profile'), icon: PersonRounded },
            { id: 'security', label: t('menu.security'), icon: LockRounded },
            { id: 'license', label: t('menu.licenses'), icon: CenterFocusStrongRounded },
            { id: 'documents', label: t('menu.documents'), icon: FolderRounded },
            { id: 'storage', label: t('menu.storage'), icon: CloudRounded },
            { id: 'preferences', label: t('menu.preferences'), icon: SettingsRounded },
            { id: 'help', label: t('menu.help'), icon: HelpOutlineRounded },
            { id: 'settings', label: t('menu.settings'), icon: TuneRounded },
          ].map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id

            return (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#106EBE]/10 text-[#106EBE] dark:text-blue-500'
                    : 'text-[#edebe9] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : 'text-[#edebe9] dark:text-dark-text'}`} />
                <span>{section.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bouton Déconnexion en bas */}
        <div className="mt-auto p-4 border-t border-[#edebe9] dark:border-dark-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all w-full"
          >
            <LogoutRounded className="w-5 h-5" />
            <span className="font-medium">{t('menu.logout')}</span>
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-bg">
          {activeSection === 'profile' && <AccountProfile />}
          {activeSection === 'security' && <AccountSecurity />}
          {activeSection === 'license' && <AccountLicense />}
          {activeSection === 'documents' && <AccountDocuments />}
          {activeSection === 'storage' && <AccountStorage />}
          {activeSection === 'preferences' && <AccountPreferences />}
          {activeSection === 'help' && <AccountHelp />}
          {activeSection === 'settings' && <AccountSettings />}
        </div>
      </div>
    </>
  )
}

export default AccountSidebar
