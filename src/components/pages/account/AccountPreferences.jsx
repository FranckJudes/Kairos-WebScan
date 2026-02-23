import { useState } from 'react'
import {
  TranslateRounded,
  DarkModeRounded,
  NotificationsRounded,
  VolumeUpRounded,
  WbSunnyRounded,
  BedtimeRounded,
  AutoAwesomeRounded,
  EmailRounded,
  SmartphoneRounded,
  VolumeOffRounded,
  LanguageRounded,
  CheckCircleRounded
} from '@mui/icons-material'
import { useDarkMode } from '../../../hooks/useDarkMode'
import useTranslation from '../../../hooks/useTranslation'
import useUserProfile from '../../../hooks/useUserProfile'
import apiAuth from '../../../services/apiAuth'
import toast from 'react-hot-toast'

const AccountPreferences = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { user } = useUserProfile()
  const { language, setLanguage, t, languages } = useTranslation('fr', user)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  })
  const [soundEnabled, setSoundEnabled] = useState(true)

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleLanguageChange = async (langCode) => {
    setLanguage(langCode)
    // Mettre à jour les préférences utilisateur sur le backend
    try {
      await apiAuth.updatePreferences({ language: langCode })
      toast.success(t('account.preferences') + ' ' + t('account.language') + ' ' + t('account.system').toLowerCase())
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la langue')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text mb-6">
        {t('account.preferences')}
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
                {t('account.language')}
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                {t('account.languageDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  language === lang.code
                    ? 'border-[#106EBE] dark:border-blue-500 bg-[#106EBE]/10 dark:bg-blue-500/10'
                    : 'border-[#edebe9] dark:border-dark-border hover:border-[#106EBE]/50 dark:hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#106EBE]/10 dark:bg-blue-500/10">
                  <LanguageRounded className="w-6 h-6 text-[#106EBE] dark:text-blue-500" />
                </div>
                <span className="flex-1 text-left">
                  <span className="block text-sm font-medium text-[#605e5c] dark:text-dark-text">
                    {lang.label}
                  </span>
                  <span className="block text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                    {lang.short}
                  </span>
                </span>
                {language === lang.code && (
                  <CheckCircleRounded className="ml-2 text-[#106EBE] dark:text-blue-500 flex-shrink-0" />
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
                {t('account.theme')}
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                {t('account.themeDescription')}
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
              <WbSunnyRounded className="text-3xl text-[#605e5c] dark:text-dark-text" />
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                {t('account.light')}
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
              <BedtimeRounded className="text-3xl text-[#605e5c] dark:text-dark-text" />
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                {t('account.dark')}
              </span>
            </button>

            <button
              className="flex flex-col items-center gap-2 px-4 py-4 rounded-lg border-2 border-[#edebe9] dark:border-dark-border hover:border-[#106EBE]/50 dark:hover:border-blue-500/50 transition-colors opacity-50 cursor-not-allowed"
              disabled
              title={t('account.systemSoon')}
            >
              <AutoAwesomeRounded className="text-3xl text-[#605e5c] dark:text-dark-text" />
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                {t('account.system')}
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
                {t('account.notifications')}
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                {t('account.notificationsDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <EmailRounded className="text-[#605e5c] dark:text-dark-textTertiary" />
              <div>
                <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                  {t('account.notificationsByEmail')}
                </p>
                <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                  {t('account.notificationsByEmailDescription')}
                </p>
              </div>
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
            <div className="flex items-center gap-3">
              <NotificationsRounded className="text-[#605e5c] dark:text-dark-textTertiary" />
              <div>
                <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                  {t('account.notificationsByPush')}
                </p>
                <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                  {t('account.notificationsByPushDescription')}
                </p>
              </div>
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
            <div className="flex items-center gap-3">
              <SmartphoneRounded className="text-[#605e5c] dark:text-dark-textTertiary" />
              <div>
                <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                  {t('account.notificationsBySms')}
                </p>
                <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                  {t('account.notificationsBySmsDescription')}
                </p>
              </div>
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
                {t('account.sound')}
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                {t('account.soundDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <VolumeUpRounded className="text-[#605e5c] dark:text-dark-textTertiary" />
              ) : (
                <VolumeOffRounded className="text-[#605e5c] dark:text-dark-textTertiary" />
              )}
              <div>
                <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                  {t('account.appSounds')}
                </p>
                <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                  {t('account.appSoundsDescription')}
                </p>
              </div>
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
