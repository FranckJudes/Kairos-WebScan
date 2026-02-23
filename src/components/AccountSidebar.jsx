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
  MenuRounded,
  ExpandLessRounded,
  ExpandMoreRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'

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
  const { user, isLoading } = useUserProfile()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (firstName) {
      return firstName[0].toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return '??'
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

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
      <div className={`fixed top-0 right-0 h-full w-full md:w-[1000px] bg-white dark:bg-dark-bgSecondary z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isAccountSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#edebe9] dark:border-dark-border bg-gradient-to-r from-[#106EBE] to-blue-600 dark:from-blue-700 dark:to-blue-800">
          <h2 className="text-white font-bold text-lg">{t('menu.myAccount') || 'Mon Compte'}</h2>
          <button
            onClick={closeAccountSidebar}
            className="text-white/80 hover:text-white rounded-full p-2 transition-colors"
            aria-label="Fermer"
          >
            <CloseRounded className="w-6 h-6" />
          </button>
        </div>

        {/* Main layout: Navigation gauche + Contenu droite */}
        <div className="flex h-[calc(100%-73px)] relative">
          {/* Navigation gauche - Desktop uniquement */}
          <div className="hidden md:flex w-64 border-r border-[#edebe9] dark:border-dark-border flex-col bg-white dark:bg-dark-bgSecondary flex-shrink-0">
            {/* Profil utilisateur */}
            <div className="flex items-center gap-3 p-4 border-b border-[#edebe9] dark:border-dark-border">
              <div className={`w-10 h-10 rounded-full ${getAvatarColor(user?.first_name || user?.email)} flex items-center justify-center text-white font-semibold text-lg shadow-lg overflow-hidden`}>
                {user?.avatar_url ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user?.first_name, user?.last_name, user?.email)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[#141414] dark:text-dark-text font-semibold text-sm truncate">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user?.email || 'Utilisateur'}
                </p>
                <p className="text-neutral-500 dark:text-dark-textTertiary text-xs truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#106EBE]/10 text-[#106EBE] dark:text-blue-500'
                        : 'text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : 'text-[#605e5c] dark:text-dark-textTertiary'}`} />
                    <span>{section.label}</span>
                  </button>
                )
              })}
            </nav>

            {/* Bouton Déconnexion en bas - toujours visible */}
            <div className="p-3 border-t border-[#edebe9] dark:border-dark-border flex-shrink-0">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all w-full"
              >
                <LogoutRounded className="w-5 h-5" />
                <span className="font-medium text-sm">{t('menu.logout')}</span>
              </button>
            </div>
          </div>

          {/* Contenu principal à droite */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-bg p-4 md:p-6 w-full pb-20 md:pb-6">
            {/* Mobile section title */}
            <div className="md:hidden mb-4 pb-3 border-b border-[#edebe9] dark:border-dark-border">
              <h3 className="font-semibold text-[#141414] dark:text-dark-text">
                {[{ id: 'profile', label: t('menu.profile') },
                  { id: 'security', label: t('menu.security') },
                  { id: 'license', label: t('menu.licenses') },
                  { id: 'documents', label: t('menu.documents') },
                  { id: 'storage', label: t('menu.storage') },
                  { id: 'preferences', label: t('menu.preferences') },
                  { id: 'help', label: t('menu.help') },
                  { id: 'settings', label: t('menu.settings') },
                ].find(s => s.id === activeSection)?.label}
              </h3>
            </div>
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

        {/* FAB flottant pour mobile */}
        <div className="md:hidden">
          {/* Overlay pour fermer le menu */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 z-20"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className="fixed bottom-6 right-6 z-30">
            {/* Menu FAB */}
            {isMobileMenuOpen && (
              <div className="absolute bottom-16 right-0 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-2xl border border-[#edebe9] dark:border-dark-border overflow-hidden min-w-[200px] mb-2">
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
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#106EBE]/10 text-[#106EBE] dark:text-blue-500'
                          : 'text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.label}</span>
                    </button>
                  )
                })}
                <div className="border-t border-[#edebe9] dark:border-dark-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogoutRounded className="w-5 h-5" />
                    <span>{t('menu.logout')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bouton FAB principal */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
                isMobileMenuOpen
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-[#106EBE] hover:bg-[#005a9e] text-white'
              }`}
            >
              {isMobileMenuOpen ? (
                <CloseRounded className="w-6 h-6" />
              ) : (
                <MenuRounded className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountSidebar
