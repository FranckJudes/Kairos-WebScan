import { useState } from 'react'
import {
  SecurityRounded,
  LockRounded,
  SmartphoneRounded,
  DevicesRounded,
  AddRounded,
  VisibilityRounded,
  VisibilityOffRounded,
  CheckRounded
} from '@mui/icons-material'
import toast from 'react-hot-toast'

const AccountSecurity = ({ user }) => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'Chrome on Windows',
      location: 'Paris, France',
      lastActive: 'Il y a 2 minutes',
      current: true,
      ip: '192.168.1.1'
    },
    {
      id: 2,
      device: 'Safari on iPhone',
      location: 'Lyon, France',
      lastActive: 'Il y a 1 heure',
      current: false,
      ip: '192.168.1.2'
    },
    {
      id: 3,
      device: 'Firefox on Mac',
      location: 'Marseille, France',
      lastActive: 'Hier',
      current: false,
      ip: '192.168.1.3'
    }
  ])

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    // Validation simple
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (passwordData.new.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    toast.success('Mot de passe mis à jour avec succès')
    setPasswordData({ current: '', new: '', confirm: '' })
  }

  const handleToggle2FA = () => {
    setIs2FAEnabled(!is2FAEnabled)
    toast.success(is2FAEnabled ? '2FA désactivé' : '2FA activé')
  }

  const handleRevokeSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    toast.success('Session révoquée')
  }

  const handleRevokeAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.current))
    toast.success('Toutes les autres sessions ont été révoquées')
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text">
          Sécurité
        </h2>
        <p className="text-slate-500 dark:text-dark-textTertiary">
          Gérez la sécurité de votre compte et vos connexions
        </p>
      </div>

      {/* Changer le mot de passe */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-500">
              <LockRounded className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                Changer le mot de passe
              </h3>
              <p className="text-sm text-slate-500 dark:text-dark-textTertiary">
                Modifiez votre mot de passe régulièrement
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="current"
                  value={passwordData.current}
                  onChange={handlePasswordChange}
                  required
                  placeholder="•••••••••"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bgTertiary rounded-xl border border-transparent focus:border-blue-500/30 focus:ring-0 transition-all text-slate-900 dark:text-dark-text"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords.current ? <VisibilityRounded className="w-5 h-5" /> : <VisibilityOffRounded className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="new"
                  value={passwordData.new}
                  onChange={handlePasswordChange}
                  required
                  placeholder="•••••••••"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bgTertiary rounded-xl border border-transparent focus:border-blue-500/30 focus:ring-0 transition-all text-slate-900 dark:text-dark-text"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords.new ? <VisibilityRounded className="w-5 h-5" /> : <VisibilityOffRounded className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirm"
                  value={passwordData.confirm}
                  onChange={handlePasswordChange}
                  required
                  placeholder="•••••••••"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-dark-bgTertiary rounded-xl border border-transparent focus:border-blue-500/30 focus:ring-0 transition-all text-slate-900 dark:text-dark-text"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPasswords.confirm ? <VisibilityRounded className="w-5 h-5" /> : <VisibilityOffRounded className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Mettre à jour le mot de passe
          </button>
        </form>
      </section>

      {/* Authentification à deux facteurs */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-500">
              <SmartphoneRounded className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                Authentification à deux facteurs (2FA)
              </h3>
              <p className="text-sm text-slate-500 dark:text-dark-textTertiary">
                Ajoutez une couche de sécurité supplémentaire
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-medium text-slate-900 dark:text-dark-text">
                  Statut 2FA
                </p>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  is2FAEnabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {is2FAEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                {is2FAEnabled
                  ? 'Votre compte est protégé par l\'authentification à deux facteurs'
                  : 'Activez la 2FA pour sécuriser votre compte'
                }
              </p>
            </div>
            <button
              onClick={handleToggle2FA}
              className={`px-5 py-2.5 font-semibold rounded-xl transition-all ${
                is2FAEnabled
                  ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-900 dark:text-slate-100'
                  : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
              }`}
            >
              {is2FAEnabled ? 'Désactiver' : 'Activer'}
              </button>
          </div>
        </div>
      </section>

      {/* Sessions actives */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-500">
              <DevicesRounded className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                Sessions actives
              </h3>
              <p className="text-sm text-slate-500 dark:text-dark-textTertiary">
                Gérez vos appareils connectés
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-dark-bgSecondary flex items-center justify-center">
                    <DevicesRounded className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-dark-text">
                      {session.device}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                        {session.location}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-dark-textSecondary">
                        {session.ip}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {session.current && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                      Actuelle
                    </span>
                  )}
                  <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                    {session.lastActive}
                  </p>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Révoquer"
                    >
                      <CloseRounded className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleRevokeAllOtherSessions}
            className="w-full mt-4 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl transition-colors text-sm"
          >
            Révoquer toutes les autres sessions
          </button>
        </div>
      </section>
    </div>
  )
}

export default AccountSecurity
