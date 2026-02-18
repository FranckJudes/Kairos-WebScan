import { useState, useEffect } from 'react'
import { CenterFocusStrongRounded, AddRounded, AutorenewRounded } from '@mui/icons-material'
import toast from 'react-hot-toast'

const AccountLicense = ({ user }) => {
  const [licenses, setLicenses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setLicenses([
        {
          id: '1',
          name: 'Kairos WebScan Pro',
          key: 'KWS-2024-XXXX-XXXX-XXXX',
          type: 'subscription',
          status: 'active',
          expires_at: '2025-12-31',
          features: ['Scan illimité', 'OCR avancé', 'Support prioritaire', 'API access']
        },
        {
          id: '2',
          name: 'Kairos WebScan Starter',
          key: 'KWS-2024-YYYY-YYYY-YYYY',
          type: 'lifetime',
          status: 'active',
          expires_at: null,
          features: ['100 scans/mois', 'OCR standard', 'Support email']
        }
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'expired':
        return 'Expirée'
      case 'suspended':
        return 'Suspendue'
      default:
        return 'Inconnu'
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text">
          Mes licences
        </h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
          <AddRounded className="w-4 h-4" />
          Ajouter une licence
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#106EBE] dark:border-blue-500"></div>
        </div>
      ) : licenses.length === 0 ? (
        <div className="text-center py-12">
          <CenterFocusStrongRounded className="w-16 h-16 text-[#c8c6c4] dark:text-dark-textTertiary mx-auto mb-4" />
          <p className="text-[#605e5c] dark:text-dark-text mb-2">Aucune licence trouvée</p>
          <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary mb-4">
            Vous n'avez pas encore de licence active
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
            <AddRounded className="w-4 h-4" />
            Obtenir une licence
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {licenses.map((license) => (
            <div
              key={license.id}
              className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden"
            >
              {/* Header de la licence */}
              <div className="p-4 border-b border-[#edebe9] dark:border-dark-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#106EBE] dark:bg-blue-600 rounded-lg">
                      <CenterFocusStrongRounded className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#605e5c] dark:text-dark-text">
                        {license.name}
                      </h3>
                      <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary mt-0.5">
                        {license.key}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-lg ${getStatusColor(license.status)}`}>
                    {getStatusLabel(license.status)}
                  </span>
                </div>
              </div>

              {/* Détails de la licence */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary mb-1">
                      Type de licence
                    </p>
                    <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                      {license.type === 'subscription' ? 'Abonnement' : 'À vie'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary mb-1">
                      Expiration
                    </p>
                    <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text">
                      {license.expires_at
                        ? new Date(license.expires_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Jamais'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary mb-2">
                    Fonctionnalités incluses
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {license.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-[#f3f2f1] dark:bg-dark-bgTertiary text-[#605e5c] dark:text-dark-text rounded-lg"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#edebe9] dark:border-dark-border">
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors">
                    <AutorenewRounded className="w-4 h-4" />
                    Renouveler
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors">
                    Gérer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AccountLicense
