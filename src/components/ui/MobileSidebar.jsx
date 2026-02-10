import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMobile } from '../../hooks/useMediaQuery'

/**
 * Composant MobileSidebar - Sidebar rétractable pour mobile
 *
 * Ce composant gère l'affichage de la sidebar sur mobile avec:
 * - Overlay sombre quand la sidebar est ouverte
 * - Animation slide-in/slide-out
 * - Fermeture au clic extérieur ou touche ESC
 * - Scroll lock sur le body quand ouvert
 */
function MobileSidebar({ isOpen, onClose, children }) {
  const isMobile = useMobile()

  // Fermer la sidebar quand on passe en mode desktop
  useEffect(() => {
    if (!isMobile && isOpen) {
      onClose()
    }
  }, [isMobile, isOpen, onClose])

  // Scroll lock quand la sidebar est ouverte sur mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, isMobile])

  // Fermeture au clic sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Fermeture à la touche ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Sur desktop, afficher normalement sans overlay
  if (!isMobile) {
    return <>{children}</>
  }

  // Sur mobile, utiliser un portail pour l'overlay
  return isOpen ? (
    <>
      {/* Overlay sombre */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Sidebar mobile avec animation */}
      {createPortal(
        <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white dark:bg-dark-bgSecondary shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
          {children}
        </div>,
        document.body
      )}
    </>
  ) : null
}

/**
 * Bouton hamburger pour ouvrir la sidebar mobile
 */
export function HamburgerButton({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 hover:bg-white/10 dark:hover:bg-white/20 rounded transition-colors"
      aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      aria-expanded={isOpen}
    >
      <span className="material-symbols-outlined text-[20px]">
        {isOpen ? 'close' : 'menu'}
      </span>
    </button>
  )
}

export default MobileSidebar
