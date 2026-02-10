import { useDarkMode } from '../../hooks/useDarkMode'

/**
 * Bouton pour basculer entre le mode clair et le mode sombre
 * Affiche une icône de lune en mode clair et de soleil en mode sombre
 */
function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  return (
    <button
      onClick={toggleDarkMode}
      className="p-1.5 md:p-1.5 hover:bg-white/10 dark:hover:bg-black/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
      title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-label={isDarkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
    >
      <span className="material-symbols-outlined text-[18px] md:text-[18px]">
        {isDarkMode ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}

export default DarkModeToggle
