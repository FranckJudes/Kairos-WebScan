import { useState, useRef } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { CheckRounded, CloseRounded, PersonRounded, CalendarTodayRounded, ShieldRounded, CloudUploadRounded, DeleteRounded } from '@mui/icons-material'
import toast from 'react-hot-toast'
import AccountFooter from './AccountFooter'
import apiAuth from '../../../services/apiAuth'

const AccountProfile = ({ user }) => {
  const { updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    job_title: user.job_title || '',
    bio: user.bio || '',
    linkedin: user.linkedin || '',
    twitter: user.twitter || '',
    website: user.website || '',
    location: user.location || ''
  })

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
      'bg-pink-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async () => {
    try {
      await updateUser({
        firstName: formData.first_name,
        lastName: formData.last_name,
        phone: formData.phone,
        jobTitle: formData.job_title,
        bio: formData.bio,
        linkedin: formData.linkedin,
        twitter: formData.twitter,
        website: formData.website,
        location: formData.location
      })
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
      job_title: user.job_title || '',
      bio: user.bio || '',
      linkedin: user.linkedin || '',
      twitter: user.twitter || '',
      website: user.website || '',
      location: user.location || ''
    })
    setAvatarPreview(user.avatar_url || null)
    setIsEditing(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Veuillez utiliser JPG, PNG ou WebP')
      return
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image est trop volumineuse (max 5MB)')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload
    handleAvatarUpload(file)
  }

  const handleAvatarUpload = async (file) => {
    setIsUploading(true)
    try {
      await apiAuth.uploadAvatar(file)
      toast.success('Avatar mis à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de l\'upload de l\'avatar')
      setAvatarPreview(user.avatar_url || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      await updateUser({ avatarUrl: null })
      setAvatarPreview(null)
      toast.success('Avatar supprimé avec succès')
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'avatar')
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const initials = getInitials(user.first_name, user.last_name, user.email)
  const avatarColor = getAvatarColor(user.first_name || user.email)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-dark-text">
          Informations du compte
        </h2>
        <p className="text-slate-500 dark:text-dark-textTertiary text-sm md:text-base">
          Gérez vos informations personnelles et les détails de votre profil.
        </p>
      </div>

      {/* Profil Public Section */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl md:rounded-3xl overflow-hidden">
        <div className="p-6 md:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 dark:text-dark-textTertiary uppercase">
              Profil public
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4 mx-auto md:mx-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
              <div className="relative group">
                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-3xl md:text-4xl shadow-2xl shadow-current/20 border-4 border-white dark:border-dark-border overflow-hidden`}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview.startsWith('data:') ? avatarPreview : `${import.meta.env.VITE_API_URL}${avatarPreview}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                {isEditing && !isUploading && (
                  <div
                    onClick={handleUploadClick}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <CloudUploadRounded className="w-8 h-8 text-white" />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-[#106EBE] dark:bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-[#005a9e] dark:hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Upload...' : 'Télécharger'}
                </button>
                {avatarPreview && (
                  <button
                    onClick={handleDeleteAvatar}
                    className="w-full px-4 py-2 text-slate-500 dark:text-dark-textTertiary text-sm font-medium hover:text-red-500 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {/* Profile Fields */}
            <div className="flex-1 w-full space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">
                  Titre professionnel
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="ex: Designer UI/UX Senior"
                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text placeholder:text-slate-400 dark:placeholder-dark-textTertiary"
                  />
                ) : (
                  <p className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl text-slate-900 dark:text-dark-text">
                    {user.job_title || '-'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Parlez-nous un peu de vous..."
                    rows={3}
                    className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text placeholder:text-slate-400 dark:placeholder-dark-textTertiary resize-none"
                  />
                ) : (
                  <p className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl text-slate-900 dark:text-dark-text whitespace-pre-wrap">
                    {user.bio || '-'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Informations Personnelles Section */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl md:rounded-3xl overflow-hidden">
        <div className="p-6 md:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 dark:text-dark-textTertiary uppercase">
              Informations personnelles
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[#106EBE] dark:text-blue-500 text-sm font-semibold hover:underline"
              >
                Modifier
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-dark-bgTertiary hover:bg-gray-300 dark:hover:bg-dark-hover text-slate-900 dark:text-dark-text rounded-xl transition-colors text-sm font-medium"
                >
                  <CloseRounded className="w-4 h-4" />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  <CheckRounded className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Prénom</label>
              {isEditing ? (
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text"
                />
              ) : (
                <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                  <p className="font-medium text-slate-900 dark:text-dark-text">{user.first_name || '-'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Nom</label>
              {isEditing ? (
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text"
                />
              ) : (
                <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                  <p className="font-medium text-slate-900 dark:text-dark-text">{user.last_name || '-'}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text"
                />
              ) : (
                <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                  <p className="font-medium text-slate-900 dark:text-dark-text">{user.email}</p>
                  {user.is_email_verified && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                      <ShieldRounded className="text-[14px]" />
                      Vérifié
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Téléphone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text"
                />
              ) : (
                <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                  <p className="font-medium text-slate-900 dark:text-dark-text">{user.phone || '-'}</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Localisation</label>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="ex: Paris, France"
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus:border-[#106EBE]/30 focus:ring-0 transition-all font-medium text-slate-900 dark:text-dark-text"
                />
              ) : (
                <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                  <p className="font-medium text-slate-900 dark:text-dark-text">{user.location || '-'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-dark-border mx-6 md:mx-8 lg:mx-10"></div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="mb-6 md:mb-8">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 dark:text-dark-textTertiary uppercase">
              Détails du compte
            </h3>
          </div>

          <div className="space-y-8 md:space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary mb-1">ID utilisateur</p>
                <p className="font-bold text-slate-900 dark:text-dark-text break-all tracking-tight">{user.id}</p>
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-dark-textSecondary hidden md:block select-all cursor-pointer hover:text-[#106EBE] dark:hover:text-blue-500 transition-colors">
                #{user.id}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary mb-1">Membre depuis</p>
                <p className="font-bold text-slate-900 dark:text-dark-text">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-bgTertiary flex items-center justify-center text-slate-500 dark:text-dark-textTertiary">
                <CalendarTodayRounded className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Réseaux Sociaux Section */}
      <section className="bg-white dark:bg-dark-bgSecondary border border-slate-200/60 dark:border-dark-border shadow-sm rounded-2xl md:rounded-3xl overflow-hidden p-6 md:p-8 lg:p-10">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h3 className="text-xs font-bold tracking-widest text-slate-400 dark:text-dark-textTertiary uppercase">
            Réseaux Sociaux
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">LinkedIn</label>
            {isEditing ? (
              <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus-within:border-[#106EBE]/30 transition-all">
                <PersonRounded className="w-5 h-5 text-slate-400 dark:text-dark-textTertiary" />
                <input
                  type="text"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="linkedin.com/in/username"
                  className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-medium text-slate-900 dark:text-dark-text placeholder:text-slate-400 dark:placeholder-dark-textTertiary"
                />
              </div>
            ) : (
              <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                <p className="font-medium text-slate-900 dark:text-dark-text">{user.linkedin || '-'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Twitter / X</label>
            {isEditing ? (
              <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus-within:border-[#106EBE]/30 transition-all">
                <PersonRounded className="w-5 h-5 text-slate-400 dark:text-dark-textTertiary" />
                <input
                  type="text"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="@username"
                  className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-medium text-slate-900 dark:text-dark-text placeholder:text-slate-400 dark:placeholder-dark-textTertiary"
                />
              </div>
            ) : (
              <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                <p className="font-medium text-slate-900 dark:text-dark-text">{user.twitter || '-'}</p>
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-500 dark:text-dark-textTertiary">Site web</label>
            {isEditing ? (
              <div className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl border border-transparent focus-within:border-[#106EBE]/30 transition-all">
                <PersonRounded className="w-5 h-5 text-slate-400 dark:text-dark-textTertiary" />
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="bg-transparent border-none p-0 focus:ring-0 w-full text-sm font-medium text-slate-900 dark:text-dark-text placeholder:text-slate-400 dark:placeholder-dark-textTertiary"
                />
              </div>
            ) : (
              <div className="px-4 md:px-5 py-3 md:py-4 bg-slate-50 dark:bg-dark-bgTertiary rounded-2xl">
                <p className="font-medium text-slate-900 dark:text-dark-text">{user.website || '-'}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <AccountFooter />
    </div>
  )
}

export default AccountProfile
