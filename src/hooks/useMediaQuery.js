import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour détecter les breakpoints media query
 * @param {string} query - La media query à tester (ex: '(min-width: 768px)')
 * @returns {boolean} - True si la media query match, false sinon
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)

    // Compatible avec les anciens navigateurs
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    } else {
      // Fallback pour les anciens navigateurs
      mediaQuery.addListener(handler)
      return () => mediaQuery.removeListener(handler)
    }
  }, [query])

  return matches
}

/**
 * Hook prédéfini pour détecter les écrans mobiles (< 768px)
 */
export function useMobile() {
  return useMediaQuery('(max-width: 767px)')
}

/**
 * Hook prédéfini pour détecter les tablettes (768px - 1023px)
 */
export function useTablet() {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

/**
 * Hook prédéfini pour détecter les desktop (≥ 768px)
 */
export function useDesktop() {
  return useMediaQuery('(min-width: 768px)')
}

/**
 * Hook prédéfini pour détecter les grands écrans (≥ 1024px)
 */
export function useLargeDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}

export default useMediaQuery
