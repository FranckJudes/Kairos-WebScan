import { useState } from 'react'
import { SettingsRounded, DeleteRounded, SecurityRounded, StorageRounded } from '@mui/icons-material'

const AccountSettings = ({ user }) => {
  const [settings, setSettings] = useState({
    autoSave: true,
    cloudSync: true,
    analytics: true,
    betaFeatures: false
  })

  const [dangerZoneOpen, setDangerZoneOpen] = useState(false)

  const handleSettingChange = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      alert('Pour des raisons de sécurité, cette action nécessite une confirmation par email. Un email de confirmation vous a été envoyé.')
    }
  }

  const handleExportData = () => {
    alert('Vos données seront exportées au format JSON. Vous recevrez un email lorsque l\'export sera prêt.')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text mb-6">
        Paramètres
      </h2>

      {/* Paramètres généraux */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#106EBE] dark:bg-blue-600 rounded-lg">
              <SettingsRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Général
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Paramètres généraux de l'application
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Sauvegarde automatique
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Sauvegarde automatique de votre travail
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('autoSave')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoSave ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Synchronisation cloud
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Synchronisez vos données sur tous vos appareils
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('cloudSync')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.cloudSync ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.cloudSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Analyses et statistiques
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Aidez-nous à améliorer l'application
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('analytics')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.analytics ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.analytics ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border">
            <div>
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Fonctionnalités bêta
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Accédez aux nouvelles fonctionnalités en avant-première
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('betaFeatures')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.betaFeatures ? 'bg-[#106EBE] dark:bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.betaFeatures ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg">
              <SecurityRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Sécurité
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Gérez la sécurité de votre compte
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <button className="w-full flex items-center justify-between py-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg px-2 transition-colors">
            <div className="text-left">
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Changer le mot de passe
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Modifiez votre mot de passe régulièrement
              </p>
            </div>
            <span className="text-[#c8c6c4] dark:text-dark-textTertiary">→</span>
          </button>

          <button className="w-full flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg px-2 transition-colors">
            <div className="text-left">
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Authentification à deux facteurs
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Ajouter une couche de sécurité supplémentaire
              </p>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
              Activé
            </span>
          </button>

          <button className="w-full flex items-center justify-between py-2 border-t border-[#edebe9] dark:border-dark-border hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg px-2 transition-colors">
            <div className="text-left">
              <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                Sessions actives
              </p>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Gérez vos appareils connectés
              </p>
            </div>
            <span className="text-[#c8c6c4] dark:text-dark-textTertiary">→</span>
          </button>
        </div>
      </div>

      {/* Stockage */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg">
              <StorageRounded className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                Stockage
              </h3>
              <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                Gérez votre espace de stockage
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#605e5c] dark:text-dark-text">
                Espace utilisé
              </span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                2.4 GB / 5 GB
              </span>
            </div>
            <div className="w-full h-2 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-[#106EBE] dark:bg-blue-600 rounded-full"
                style={{ width: '48%' }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExportData}
              className="flex-1 px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Exporter mes données
            </button>
            <button className="flex-1 px-4 py-2 border border-[#edebe9] dark:border-dark-border hover:bg-[#f3f2f1] dark:hover:bg-dark-hover text-[#605e5c] dark:text-dark-text rounded-lg transition-colors text-sm font-medium">
              Gérer le stockage
            </button>
          </div>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-red-200 dark:border-red-900 overflow-hidden">
        <div className="p-4 border-b border-red-200 dark:border-red-900">
          <button
            onClick={() => setDangerZoneOpen(!dangerZoneOpen)}
            className="flex items-center gap-3 w-full"
          >
            <div className="p-2 bg-red-600 dark:bg-red-500 rounded-lg">
              <DeleteRounded className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-base font-semibold text-red-600 dark:text-red-400">
                Zone dangereuse
              </h3>
              <p className="text-xs text-red-400 dark:text-red-500">
                Actions irréversibles
              </p>
            </div>
            <span className={`text-red-600 dark:text-red-400 transition-transform ${
              dangerZoneOpen ? 'rotate-180' : ''
            }`}>
              ▼
            </span>
          </button>
        </div>

        {dangerZoneOpen && (
          <div className="p-4 space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                Supprimer le compte
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mb-3">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Supprimer mon compte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountSettings
