import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DocumentsProvider } from './contexts/DocumentsContext'
import './index.css'
import { router } from './routes'

// Filtrer les warnings de pdf.js AVANT tout chargement
const originalWarn = console.warn
console.warn = function(...args) {
  const message = args[0]
  if (typeof message === 'string') {
    // Ignorer les warnings connus de pdf.js pour les PDFs malformés
    if (message.includes('getHexString') ||
        message.includes('InvalidPDFException') ||
        message.includes('Indexing all PDF objects') ||
        message.includes('Warning:')) {
      return
    }
  }
  originalWarn.apply(console, args)
}

// Initialisation du dark mode AVANT le montage de React
// Cela évite le clignotement et garantit que la classe est appliquée immédiatement
const initializeDarkMode = () => {
  const stored = localStorage.getItem('darkMode')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = stored !== null ? JSON.parse(stored) : prefersDark

  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Exécuter l'initialisation immédiatement
initializeDarkMode()

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DocumentsProvider>
        <RouterProvider router={router} />
      </DocumentsProvider>
    </QueryClientProvider>
  </StrictMode>,
)
