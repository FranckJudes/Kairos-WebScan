import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DocumentsProvider } from './contexts/DocumentsContext'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { router } from './routes'
import { initializeAppStates } from './app/appStateInitializer'

const originalWarn = console.warn
console.warn = function(...args) {
  const message = args[0]
  if (typeof message === 'string') {
    if (message.includes('getHexString') ||
        message.includes('InvalidPDFException') ||
        message.includes('Indexing all PDF objects') ||
        message.includes('Warning:')) {
      return
    }
  }
  originalWarn.apply(console, args)
}

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

initializeDarkMode()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
    },
  },
})

const initializeApp = async () => {
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['typology', 'tree'],
        queryFn: () => fetch('/api/typology/tree').then(res => res.json()),
        staleTime: 10 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['scan-profiles'],
        queryFn: () => fetch('/api/scan-profiles').then(res => res.json()),
        staleTime: 10 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: ['scan-settings', 'defaults'],
        queryFn: () => fetch('/api/scan-settings/defaults').then(res => res.json()),
        staleTime: 15 * 60 * 1000,
      }),
    ])
  } catch (error) {
    console.error('[Main] Erreur lors de l\'initialisation des états globaux:', error)
  }
}

// Lancer l'initialisation
initializeApp()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DocumentsProvider>
          <RouterProvider router={router} />
        </DocumentsProvider>
      </AuthProvider>
      <Toaster position="top-center" />
    </QueryClientProvider>
  </StrictMode>,
)
