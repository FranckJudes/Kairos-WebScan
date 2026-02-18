import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  PersonRounded,
  CenterFocusStrongRounded,
  FolderRounded,
  TranslateRounded,
  DarkModeRounded,
  NotificationsRounded,
  HelpOutlineRounded,
  SettingsRounded,
  KeyboardArrowLeftRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'

// Sous-composants pour chaque section
import AccountProfile from './account/AccountProfile'
import AccountLicense from './account/AccountLicense'
import AccountDocuments from './account/AccountDocuments'
import AccountPreferences from './account/AccountPreferences'
import AccountHelp from './account/AccountHelp'
import AccountSettings from './account/AccountSettings'

const SECTIONS = [
  { id: 'profile', label: 'Informations du compte', icon: PersonRounded },
  { id: 'license', label: 'Mes licences', icon: CenterFocusStrongRounded },
  { id: 'documents', label: 'Documents récents', icon: FolderRounded },
  { id: 'preferences', label: 'Préférences', icon: SettingsRounded },
  { id: 'help', label: 'Aide et support', icon: HelpOutlineRounded },
  { id: 'settings', label: 'Paramètres', icon: SettingsRounded },
]

const AccountPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState('profile')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Récupérer la section depuis l'URL (hash ou query param)
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

  const handleBackToHome = () => {
    navigate('/')
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#605e5c] dark:text-dark-text">Chargement...</p>
      </div>
    )
  }

  const initials = getInitials(user.first_name, user.last_name, user.email)
  const avatarColor = getAvatarColor(user.first_name || user.email)
  const ActiveIcon = SECTIONS.find(s => s.id === activeSection)?.icon || PersonRounded

  return (
    <div className="h-full flex flex-col bg-white dark:bg-dark-bgSecondary">
      {/* Header de la page */}
      <div className="px-6 py-4 border-b border-[#edebe9] dark:border-dark-border">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackToHome}
            className="p-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
            title="Retour à l'accueil"
          >
            <KeyboardArrowLeftRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-text" />
          </button>
          <h1 className="text-2xl font-bold text-[#605e5c] dark:text-dark-text">
            Mon compte
          </h1>
        </div>

        {/* Profil summary */}
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white text-lg font-medium`}>
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#605e5c] dark:text-dark-text">
              {user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : 'Utilisateur'}
            </p>
            <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de navigation - Desktop */}
        <div className="hidden md:flex w-64 flex-col border-r border-[#edebe9] dark:border-dark-border overflow-y-auto">
          <nav className="flex-1 p-4 space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id

              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#106EBE] text-white dark:bg-blue-600'
                      : 'text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span>{section.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Menu mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="fixed bottom-4 right-4 z-40 p-4 bg-[#106EBE] dark:bg-blue-600 text-white rounded-full shadow-lg"
          >
            <ActiveIcon className="w-6 h-6" />
          </button>

          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
              <div
                className="absolute bottom-20 right-4 w-64 bg-white dark:bg-dark-bgSecondary rounded-lg shadow-xl border border-[#edebe9] dark:border-dark-border"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="p-2 space-y-1">
                  {SECTIONS.map((section) => {
                    const Icon = section.icon
                    const isActive = activeSection === section.id

                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionChange(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#106EBE] text-white dark:bg-blue-600'
                            : 'text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                        <span>{section.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          )}
        </div>

        {/* Contenu de la section active */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeSection === 'profile' && <AccountProfile user={user} />}
            {activeSection === 'license' && <AccountLicense user={user} />}
            {activeSection === 'documents' && <AccountDocuments user={user} />}
            {activeSection === 'preferences' && <AccountPreferences user={user} />}
            {activeSection === 'help' && <AccountHelp user={user} />}
            {activeSection === 'settings' && <AccountSettings user={user} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
