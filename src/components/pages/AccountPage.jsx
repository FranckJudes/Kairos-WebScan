import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import useUserProfile from '../../hooks/useUserProfile'
import useTranslation from '../../hooks/useTranslation'
import {
  PersonRounded,
  CenterFocusStrongRounded,
  FolderRounded,
  SettingsRounded,
  HelpOutlineRounded,
  TuneRounded,
  LogoutRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import AccountProfile from './account/AccountProfile'
import AccountLicense from './account/AccountLicense'
import AccountDocuments from './account/AccountDocuments'
import AccountPreferences from './account/AccountPreferences'
import AccountHelp from './account/AccountHelp'
import AccountSettings from './account/AccountSettings'
import AccountFooter from './account/AccountFooter'

const SECTIONS = [
  { id: 'profile', label: 'Profil', icon: PersonRounded },
  { id: 'license', label: 'Licences', icon: CenterFocusStrongRounded },
  { id: 'documents', label: 'Documents', icon: FolderRounded },
  { id: 'preferences', label: 'Préférences', icon: SettingsRounded },
  { id: 'help', label: 'Aide', icon: HelpOutlineRounded },
  { id: 'settings', label: 'Paramètres', icon: TuneRounded },
]

const AccountPage = () => {
  const { logout } = useAuth()
  const { user, isLoading } = useUserProfile()
  const { t } = useTranslation('fr', user)
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState('profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Récupérer la section depuis l'URL (hash)
  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && SECTIONS.find(s => s.id === hash)) {
      setActiveSection(hash)
    }
  }, [location])

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
    setIsMobileMenuOpen(false)
    navigate(`/account#${sectionId}`, { replace: true })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success(t('menu.logout'))
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

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-dark-bg">
        <p className="text-slate-500 dark:text-dark-textTertiary">{t('page.loading')}</p>
      </div>
    )
  }

  const initials = getInitials(user.first_name, user.last_name, user.email)
  const avatarColor = getAvatarColor(user.first_name || user.email)

  return (
    <div className="h-screen bg-slate-50 dark:bg-dark-bg flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-80 flex-col border-r border-slate-200/60 dark:border-dark-border bg-white dark:bg-dark-bgSecondary flex-shrink-0">
        <div className="p-8">
          {/* Profil utilisateur en haut de sidebar */}
          <div className="flex items-center gap-4 mb-10">
            <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-current/20 overflow-hidden`}>
              {user.avatar_url ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-dark-text leading-tight">
                {user.first_name && user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : t('menu.user')}
              </p>
              <p className="text-sm text-slate-500 dark:text-dark-textTertiary">{user.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id

              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
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
        </div>

        {/* Bouton Déconnexion en bas */}
        <div className="mt-auto p-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all w-full"
          >
            <LogoutRounded className="w-5 h-5" />
            <span className="font-medium">{t('menu.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 max-w-5xl mx-auto px-6 md:px-8 lg:px-16 py-8 md:py-12 overflow-y-auto h-full">
        <div className="h-full">
          {activeSection === 'profile' && <AccountProfile user={user} />}
          {activeSection === 'license' && <AccountLicense user={user} />}
          {activeSection === 'documents' && <AccountDocuments user={user} />}
          {activeSection === 'preferences' && <AccountPreferences user={user} />}
          {activeSection === 'help' && <AccountHelp user={user} />}
          {activeSection === 'settings' && <AccountSettings user={user} />}
          {!activeSection.includes('profile') && <AccountFooter />}
        </div>
      </main>

      {/* Menu mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-14 h-14 rounded-full bg-white dark:bg-dark-bgTertiary shadow-2xl border border-slate-200 dark:border-dark-borderLight flex items-center justify-center text-slate-600 dark:text-dark-textSecondary hover:scale-110 transition-transform active:scale-105"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
            <div
              className="absolute bottom-24 right-6 w-72 bg-white dark:bg-dark-bgSecondary rounded-2xl shadow-2xl border border-slate-200 dark:border-dark-border p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profil utilisateur mobile */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-dark-border">
                <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-lg overflow-hidden`}>
                  {user.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_URL}${user.avatar_url}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-dark-text text-sm">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : t('menu.user')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-dark-textTertiary">{user.email}</p>
                </div>
              </div>

              {/* Navigation mobile */}
              <nav className="space-y-1">
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

              {/* Bouton déconnexion mobile */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-dark-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all w-full"
                >
                  <LogoutRounded className="w-5 h-5" />
                  <span className="font-medium">{t('menu.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountPage
