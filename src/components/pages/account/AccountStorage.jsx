import { useState, useEffect } from 'react'
import { CloudRounded, DownloadRounded, FolderOpenRounded, DeleteRounded, CloudUploadRounded } from '@mui/icons-material'
import toast from 'react-hot-toast'

const AccountStorage = ({ user }) => {
  const [storageUsed, setStorageUsed] = useState(2.4)
  const [storageTotal, setStorageTotal] = useState(5)
  const [isExporting, setIsExporting] = useState(false)

  const storagePercentage = ((storageUsed / storageTotal) * 100).toFixed(1)
  const storageRemaining = (storageTotal - storageUsed).toFixed(1)

  const getFileCountByType = (type) => {
    // Simulé - en réalité viendrait de l'API
    const counts = {
      pdf: 124,
      images: 89,
      others: 23
    }
    return counts[type] || 0
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Simulation de l'export
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer un fichier JSON avec les données utilisateur
      const userData = {
        profile: {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          job_title: user.job_title,
          bio: user.bio
        },
        preferences: {
          language: 'fr',
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        },
        export_date: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kairos-export-${user.email}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Données exportées avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'export des données')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text">
          Stockage
        </h2>
        <p className="text-slate-500 dark:text-dark-textTertiary">
          Gérez votre espace de stockage et vos fichiers
        </p>
      </div>

      {/* Utilisation du stockage */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-500">
              <CloudRounded className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                Utilisation du stockage
              </h3>
              <p className="text-sm text-slate-500 dark:text-dark-textTertiary">
                Espace utilisé sur votre plan actuel
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Barre de progression */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-dark-text">
                  {storageUsed} GB utilisés
                </p>
                <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                  sur {storageTotal} GB disponibles
                </p>
              </div>
              <span className="text-sm font-semibold text-blue-500">
                {storagePercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-dark-bgTertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-dark-textTertiary mt-2">
              {storageRemaining} GB restants
            </p>
          </div>

          {/* Détails par type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-xs">PDF</span>
                </div>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {getFileCountByType('pdf')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                Documents PDF
              </p>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">image</span>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getFileCountByType('images')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                Images
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-lg">description</span>
                </div>
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {getFileCountByType('others')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                Autres fichiers
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/60 dark:border-dark-border">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <DownloadRounded className={`w-5 h-5 ${isExporting ? 'animate-pulse' : ''}`} />
              {isExporting ? 'Export en cours...' : 'Exporter mes données'}
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl transition-colors">
              <CloudUploadRounded className="w-5 h-5" />
              Gérer le stockage
            </button>
          </div>
        </div>
      </section>

      {/* Catégories de fichiers */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200/60 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-500">
              <FolderOpenRounded className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-dark-text">
                Derniers fichiers
              </h3>
              <p className="text-sm text-slate-500 dark:text-dark-textTertiary">
                Vos fichiers les plus récents
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-dark-border">
          {/* Fichier 1 */}
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-lg">picture_as_pdf</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-dark-text truncate">
                Document officiel.pdf
              </p>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                2.4 MB • Il y a 2 heures
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <DownloadRounded className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <DeleteRounded className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fichier 2 */}
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-lg">image</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-dark-text truncate">
                Scan_document_001.jpg
              </p>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                1.8 MB • Hier
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <DownloadRounded className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <DeleteRounded className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fichier 3 */}
          <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500 text-lg">description</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-dark-text truncate">
                Notes_personnelles.docx
              </p>
              <p className="text-xs text-slate-500 dark:text-dark-textTertiary">
                156 KB • Il y a 3 jours
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <DownloadRounded className="w-4 h-4" />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <DeleteRounded className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voir tous les fichiers */}
          <div className="p-4">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium rounded-xl transition-colors">
              <FolderOpenRounded className="w-5 h-5" />
              Voir tous les fichiers
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AccountStorage
