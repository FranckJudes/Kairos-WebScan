import { useEffect, useState } from 'react'

/**
 * Hook personnalisé pour gérer le dark mode
 * Utilise localStorage pour persister le choix de l'utilisateur
 * Détecte également la préférence système par défaut
 */
function useDarkMode() {
  // Fonction pour initialiser le dark mode
  const initializeDarkMode = () => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      return JSON.parse(stored)
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDarkMode, setIsDarkMode] = useState(initializeDarkMode)

  // Appliquer la classe 'dark' immédiatement au montage
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  // Sauvegarder dans localStorage quand ça change
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode(prev => !prev)

  return { isDarkMode, toggleDarkMode }
}

export { useDarkMode }
export default useDarkMode
