import { useState, useEffect } from 'react'
import { TranslateRounded, DarkModeRounded, NotificationsRounded, VolumeUpRounded } from '@mui/icons-material'
import { useDarkMode } from '../../../hooks/useDarkMode'

const AccountPreferences = ({ user }) => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [language, setLanguage] = useState('fr')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  })
  const [soundEnabled, setSoundEnabled] = useState(true)

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' }
  ]

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text mb-6">
        Préférences
      </h2>

      {/* Langue */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#106EBE] dark:bg-blue-600 rounded-lg">
              <TranslateRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Langue
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Choisissez votre langue préférée
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  language === lang.code
                    ? 'border-[#106EBE] dark:border-blue-500 bg-[#106EBE]/10 dark:bg-blue-500/10'
                    : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE]/50 dark:hover:border-blue-500/50'
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                  {lang.label}
                </span>
                {language === lang.code && (
                  <span className="ml-auto text-[#106EBE] dark:text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thème */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg">
              <DarkModeRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Thème
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Personnalisez l'apparence de l'application
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                if (isDarkMode) toggleDarkMode()
              }}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-colors ${
                !isDarkMode
                  ? 'border-[#106EBE] dark:border-blue-500 bg-[#106EBE]/10 dark:bg-blue-500/10'
                  : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE]/50 dark:hover:border-blue-500/50'
              }`}
            >
              <span className="text-3xl">☀️</span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Clair
              </span>
            </button>

            <button
              onClick={() => {
                if (!isDarkMode) toggleDarkMode()
              }}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 transition-colors ${
                isDarkMode
                  ? 'border-[#106EBE] dark:border-blue-500 bg-[#106EBE]/10 dark:bg-blue-500/10'
                  : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE]/50 dark:hover:border-blue-500/50'
              }`}
            >
              <span className="text-3xl">🌙</span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Sombre
              </span>
            </button>

            <button
              className="flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 border-[#edebe9] dark:border-dark-border hover:border-[#106EBE]/50 dark:hover:border-blue-500/50 transition-colors opacity-50 cursor-not-allowed"
              disabled
              title="Bientôt disponible"
            >
              <span className="text-3xl">🔄</span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Système
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg">
              <NotificationsRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Notifications
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Gérez vos préférences de notification
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Notifications par email
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Recevez les mises à jour importantes par email
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.email ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Notifications push
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Recevez les notifications dans le navigateur
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange('push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.push ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Notifications SMS
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Recevez les alertes importantes par SMS
              </p>
            </div>
            <button
              onClick={() => handleNotificationChange('sms')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.sms ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications.sms ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Son */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 dark:bg-orange-500 rounded-lg">
              <VolumeUpRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Son
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Activez ou désactivez les sons de l'application
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Sons de l'application
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Sons pour les notifications et actions
              </p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPreferences
