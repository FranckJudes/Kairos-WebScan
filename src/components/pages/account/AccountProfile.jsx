import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { EditRounded, CheckRounded, CloseRounded } from '@mui/icons-material'
import toast from 'react-hot-toast'

const AccountProfile = ({ user }) => {
  const { updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    try {
      await updateUser(formData)
      setIsEditing(false)
      toast.success('Informations mises à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des informations')
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text">
          Informations du compte
        </h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <EditRounded className="w-4 h-4" />
            Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#605e5c] dark:text-dark-text rounded-lg transition-colors text-sm font-medium"
            >
              <CloseRounded className="w-4 h-4" />
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <CheckRounded className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
        {/* Informations personnelles */}
        <div className="p-6 border-b border-[#edebe9] dark:border-dark-border">
          <h3 className="text-sm font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider mb-4">
            Informations personnelles
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                  Prénom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg">
                    {user.first_name || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                  Nom
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg">
                    {user.last_name || '-'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg flex-1">
                    {user.email}
                  </p>
                  {user.is_email_verified && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                      Vérifié
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#605e5c] dark:text-dark-text mb-1">
                Téléphone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-3 py-2 border border-[#edebe9] dark:border-dark-border rounded-lg bg-white dark:bg-dark-bgSecondary text-[#605e5c] dark:text-dark-text focus:ring-2 focus:ring-[#106EBE] dark:focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="px-3 py-2 text-sm text-[#605e5c] dark:text-dark-text bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg">
                  {user.phone || '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Informations du compte */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider mb-4">
            Détails du compte
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#edebe9] dark:border-dark-border">
              <span className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                ID utilisateur
              </span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                {user.id}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#edebe9] dark:border-dark-border">
              <span className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                Membre depuis
              </span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                }) : '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#edebe9] dark:border-dark-border">
              <span className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                Statut du compte
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-lg">
                Actif
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                Type de compte
              </span>
              <span className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountProfile
