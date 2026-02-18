import { toast } from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Récupère le token d'authentification depuis le stockage
 */
const getToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

/**
 * Effectue une requête API authentifiée
 */
const authFetch = async (endpoint, options = {}) => {
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important: Envoie les cookies HttpOnly
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))

    if (response.status === 422 && error.detail) {
      if (Array.isArray(error.detail)) {
        const firstError = error.detail[0]
        throw new Error(firstError.msg || 'Erreur de validation')
      } else if (typeof error.detail === 'string') {
        throw new Error(error.detail)
      }
    }

    throw new Error(error.detail || error.message || 'Erreur lors de la requête')
  }

  return response.json()
}

const apiAuth = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: async (data) => {
    try {
      const response = await authFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          acceptTerms: data.acceptTerms
        })
      })
      toast.success(response.message)
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Connexion d'un utilisateur
   */
  login: async (email, password, rememberMe = false) => {
    try {
      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe })
      })
      toast.success('Connexion réussie !')
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Vérification de l'email
   */
  verifyEmail: async (token) => {
    try {
      const response = await authFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
      })
      toast.success(response.message)
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Demande de réinitialisation de mot de passe
   */
  forgotPassword: async (email) => {
    try {
      const response = await authFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      toast.success(response.message)
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Réinitialisation du mot de passe
   */
  resetPassword: async (token, password, confirmPassword) => {
    try {
      const response = await authFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword })
      })
      toast.success(response.message)
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Récupération du profil utilisateur
   */
  getProfile: async () => {
    try {
      const response = await authFetch('/api/auth/profile')
      return response
    } catch (error) {
      throw error
    }
  },

  /**
   * Mise à jour du profil
   */
  updateProfile: async (data) => {
    try {
      const response = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          avatar_url: data.avatarUrl
        })
      })
      toast.success('Profil mis à jour avec succès')
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Changement de mot de passe
   */
  changePassword: async (currentPassword, newPassword, confirmNewPassword) => {
    try {
      const response = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword
        })
      })
      toast.success(response.message)
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Mise à jour des préférences
   */
  updatePreferences: async (preferences) => {
    try {
      const response = await authFetch('/api/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences)
      })
      toast.success('Préférences mises à jour')
      return response
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  },

  /**
   * Déconnexion
   */
  logout: async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  },

  /**
   * Vérification de la force du mot de passe
   */
  checkPasswordStrength: async (password) => {
    try {
      const response = await authFetch('/api/auth/check-password-strength', {
        method: 'POST',
        body: JSON.stringify({ password })
      })
      return response
    } catch (error) {
      throw error
    }
  }
}

export default apiAuth
