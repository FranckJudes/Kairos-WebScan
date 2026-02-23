import { useState, useEffect, useMemo } from 'react'
import translations from '../i18n/translations'

/**
 * Hook personnalisé pour gérer les traductions
 * @param {string} initialLanguage - Langue initiale (défaut: 'fr')
 * @param {Object} userProfile - Profil utilisateur depuis React Query
 * @returns {Object} - { language, setLanguage, t, languages }
 */
const useTranslation = (initialLanguage = 'fr', userProfile = null) => {
  // Priorité à la langue du profil utilisateur si disponible
  const getInitialLanguage = () => {
    // Si un profil est fourni avec une langue, l'utiliser
    if (userProfile?.language && translations[userProfile.language]) {
      return userProfile.language
    }
    // Sinon, essayer depuis localStorage
    const saved = localStorage.getItem('app-language')
    if (saved && translations[saved]) {
      return saved
    }
    return initialLanguage
  }

  const [language, setLanguageState] = useState(() => getInitialLanguage())

  // Synchroniser la langue avec le profil utilisateur quand il change
  const setLanguage = (newLanguage) => {
    setLanguageState(newLanguage)
    localStorage.setItem('app-language', newLanguage)
  }

  // Fonction de traduction
  const t = (keyPath) => {
    // Supporte les clés avec notation par points (ex: 'account.preferences')
    const keys = keyPath.split('.')
    let value = translations[language]

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key]
      } else {
        return key // Retourne la clé si non trouvée
      }
    }

    return value || keyPath
  }

  // Langues disponibles
  const languages = useMemo(() => [
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'es', label: 'Español', short: 'ES' },
    { code: 'de', label: 'Deutsch', short: 'DE' },
    { code: 'it', label: 'Italiano', short: 'IT' }
  ], [])

  // Mettre à jour le document HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  // Mettre à jour la langue depuis le profil utilisateur (si fourni)
  useEffect(() => {
    if (userProfile?.language && userProfile.language !== language && translations[userProfile.language]) {
      setLanguageState(userProfile.language)
    }
  }, [userProfile?.language])

  return {
    language,
    setLanguage,
    t,
    languages,
  }
}

export default useTranslation
