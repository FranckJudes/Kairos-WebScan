import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAccountSidebar } from '../contexts/AccountSidebarContext'
import {
  PersonRounded,
  LockRounded,
  SettingsRounded,
  LogoutRounded,
  HelpOutlineRounded,
  KeyboardArrowDownRounded,
  FolderRounded,
  CenterFocusStrongRounded,
  CloudRounded
} from '@mui/icons-material'

const AccountMenu = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { openAccountSidebar } = useAccountSidebar()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    setIsOpen(false)
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
    return null
  }

  const initials = getInitials(user.first_name, user.last_name, user.email)
  const avatarColor = getAvatarColor(user.first_name || user.email)

  return (
    <div className="relative" ref={menuRef}>
      {/* Bouton du menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/20 transition-colors text-white"
      >
        {/* Avatar */}
        <div className={`w-8 h-8 ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
          {initials}
        </div>

        {/* Nom complet (visible sur desktop) */}
        <span className="hidden md:block text-sm font-medium text-white">
          {user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email}
        </span>

        {/* Flèche */}
        <KeyboardArrowDownRounded
          className={`w-5 h-5 text-white/80 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-bgSecondary rounded-lg shadow-xl border border-[#edebe9] dark:border-dark-border z-50">
          {/* Header avec infos utilisateur */}
          <div className="px-4 py-4 border-b border-[#edebe9] dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white text-lg font-medium`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#605e5c] dark:text-dark-text truncate">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'Utilisateur'}
                </p>
                <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary truncate">
                  {user.email}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.is_email_verified
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {user.is_email_verified ? 'Vérifié' : 'Non vérifié'}
                </span>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            {/* Compte */}
            <div className="px-3 py-2">
              <p className="px-3 text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Compte
              </p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('profile')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <PersonRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Profil</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('license')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <CenterFocusStrongRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Licences</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('documents')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <FolderRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Documents</span>
            </button>

            {/* Sécurité */}
            <div className="px-3 py-2 mt-2">
              <p className="px-3 text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Sécurité
              </p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('security')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <LockRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Mot de passe et 2FA</span>
            </button>

            {/* Stockage */}
            <div className="px-3 py-2 mt-2">
              <p className="px-3 text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Stockage
              </p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('storage')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <CloudRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Espace et fichiers</span>
            </button>

            {/* Préférences */}
            <div className="px-3 py-2 mt-2">
              <p className="px-3 text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Préférences
              </p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('preferences')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <SettingsRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Préférences</span>
            </button>

            {/* Autre */}
            <div className="px-3 py-2 mt-2">
              <p className="px-3 text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                Autre
              </p>
            </div>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('help')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <HelpOutlineRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Aide</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                openAccountSidebar('settings')
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
            >
              <SettingsRounded className="w-5 h-5 text-[#605e5c] dark:text-dark-textTertiary" />
              <span>Paramètres</span>
            </button>

            {/* Déconnexion */}
            <div className="border-t border-[#edebe9] dark:border-dark-border mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogoutRounded className="w-5 h-5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountMenu
