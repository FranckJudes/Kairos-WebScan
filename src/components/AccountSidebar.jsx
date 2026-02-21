import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAccountSidebar } from '../contexts/AccountSidebarContext'
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
  CloseRounded
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

const SECTIONS = [
  { id: 'profile', label: 'Profil', icon: PersonRounded },
  { id: 'security', label: 'Sécurité', icon: LockRounded },
  { id: 'license', label: 'Licences', icon: CenterFocusStrongRounded },
  { id: 'documents', label: 'Documents', icon: FolderRounded },
  { id: 'storage', label: 'Stockage', icon: CloudRounded },
  { id: 'preferences', label: 'Préférences', icon: SettingsRounded },
  { id: 'help', label: 'Aide', icon: HelpOutlineRounded },
  { id: 'settings', label: 'Paramètres', icon: TuneRounded },
]

const AccountSidebar = () => {
  const { user, logout } = useAuth()
  const { isAccountSidebarOpen, closeAccountSidebar, initialSection } = useAccountSidebar()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')

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
    if (isAccountSidebarOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isAccountSidebarOpen, closeAccountSidebar])

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    closeAccountSidebar()
    toast.success('Déconnexion réussie')
  }

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return '??'
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-pink-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  if (!user) {
    return null
  }

  const initials = getInitials(user.first_name, user.last_name, user.email)
  const avatarColor = getAvatarColor(user.first_name || user.email)

  if (!isAccountSidebarOpen) return null

  return (
    <>
      {/* Backdrop flouté */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={closeAccountSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-1/2 min-w-[500px] max-w-[800px] bg-white dark:bg-dark-bgSecondary z-50 shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#edebe9] dark:border-dark-border bg-gradient-to-r from-[#106EBE] to-blue-600 dark:from-blue-700 dark:to-blue-800">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold shadow-lg`}>
                {initials}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'Utilisateur'}
                </p>
                <p className="text-white/80 text-xs">{user.email}</p>
              </div>
            </div>
            <button
              onClick={closeAccountSidebar}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <CloseRounded className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar navigation */}
            <aside className="w-64 flex-col border-r border-[#edebe9] dark:border-dark-border flex-shrink-0 overflow-y-auto">
              <nav className="p-4 space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#106EBE]/10 text-[#106EBE] dark:text-blue-500'
                          : 'text-slate-500 dark:text-dark-textSecondary hover:bg-slate-100 dark:hover:bg-dark-hover'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
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
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </aside>

            {/* Contenu principal */}
            <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-bg">
              <div className="p-6">
                {activeSection === 'profile' && <AccountProfile user={user} />}
                {activeSection === 'security' && <AccountSecurity user={user} />}
                {activeSection === 'license' && <AccountLicense user={user} />}
                {activeSection === 'documents' && <AccountDocuments user={user} />}
                {activeSection === 'storage' && <AccountStorage user={user} />}
                {activeSection === 'preferences' && <AccountPreferences user={user} />}
                {activeSection === 'help' && <AccountHelp user={user} />}
                {activeSection === 'settings' && <AccountSettings user={user} />}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export default AccountSidebar
