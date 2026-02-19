import { useEffect, useState } from 'react'

/**
 */
function useDarkMode() {
  const initializeDarkMode = () => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      return JSON.parse(stored)
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDarkMode, setIsDarkMode] = useState(initializeDarkMode)

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode))
  }, [isDarkMode])

  const toggleDarkMode = () => setIsDarkMode(prev => !prev)

  return { isDarkMode, toggleDarkMode }
}

export { useDarkMode }
export default useDarkMode
