import { useState, useEffect } from 'react'
import { FolderRounded, DescriptionRounded, DeleteRounded, DownloadRounded } from '@mui/icons-material'
import toast from 'react-hot-toast'

const AccountDocuments = ({ user }) => {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simuler le chargement des documents récents
    // Remplacer par un vrai appel API
    setTimeout(() => {
      setDocuments([
        {
          id: '1',
          name: 'Contrat_location.pdf',
          type: 'pdf',
          size: '2.4 MB',
          pages: 12,
          created_at: '2025-02-15T10:30:00',
          thumbnail: null
        },
        {
          id: '2',
          name: 'Facture_EDF_2025.pdf',
          type: 'pdf',
          size: '856 KB',
          pages: 2,
          created_at: '2025-02-10T14:22:00',
          thumbnail: null
        },
        {
          id: '3',
          name: 'Carte_identite_scan.jpg',
          type: 'image',
          size: '1.2 MB',
          pages: 1,
          created_at: '2025-02-05T09:15:00',
          thumbnail: null
        },
        {
          id: '4',
          name: 'Dossier_complet.zip',
          type: 'archive',
          size: '15.8 MB',
          pages: 45,
          created_at: '2025-01-28T16:45:00',
          thumbnail: null
        }
      ])
      setIsLoading(false)
    }, 500)
  }, [])

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return '📄'
      case 'image':
        return '🖼️'
      case 'archive':
        return '📦'
      default:
        return '📁'
    }
  }

  const handleDelete = (docId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      setDocuments(documents.filter(doc => doc.id !== docId))
      toast.success('Document supprimé')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Aujourd'hui"
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#605e5c] dark:text-dark-text">
          Documents récents
        </h2>
        <div className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
          {documents.length} document{documents.length > 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#106EBE] dark:border-blue-500"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FolderRounded className="w-16 h-16 text-[#c8c6c4] dark:text-dark-textTertiary mx-auto mb-4" />
          <p className="text-[#605e5c] dark:text-dark-text mb-2">Aucun document</p>
          <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
            Vous n'avez pas encore de document sauvegardé
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-bgSecondary rounded-lg border border-[#edebe9] dark:border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f3f2f1] dark:bg-dark-bgTertiary border-b border-[#edebe9] dark:border-dark-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider hidden sm:table-cell">
                    Taille
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider hidden md:table-cell">
                    Pages
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[#605e5c] dark:text-dark-text uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edebe9] dark:divide-dark-border">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#f3f2f1] dark:hover:bg-dark-hover transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f3f2f1] dark:bg-dark-bgTertiary rounded-lg flex items-center justify-center text-xl">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#605e5c] dark:text-dark-text truncate max-w-[200px] sm:max-w-[300px]">
                            {doc.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[#605e5c] dark:text-dark-text">
                        {doc.size}
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[#605e5c] dark:text-dark-text">
                        {doc.pages} page{doc.pages > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs text-[#c8c6c4] dark:text-dark-textTertiary">
                        {formatDate(doc.created_at)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-2 hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <DownloadRounded className="w-4 h-4 text-[#605e5c] dark:text-dark-text" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <DeleteRounded className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {documents.length > 10 && (
            <div className="px-4 py-3 border-t border-[#edebe9] dark:border-dark-border flex items-center justify-between">
              <p className="text-sm text-[#c8c6c4] dark:text-dark-textTertiary">
                Affichage 1-{documents.length} sur {documents.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors disabled:opacity-50"
                  disabled
                >
                  Précédent
                </button>
                <button
                  className="px-3 py-1 text-sm text-[#605e5c] dark:text-dark-text hover:bg-[#f3f2f1] dark:hover:bg-dark-hover rounded-lg transition-colors disabled:opacity-50"
                  disabled
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AccountDocuments
