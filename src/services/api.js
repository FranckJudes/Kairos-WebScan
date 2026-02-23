const API_BASE_URL = import.meta.env.VITE_API_URL;

const getToken = () => {
  const sessionToken = sessionStorage.getItem('token')
  const localToken = localStorage.getItem('token')
  const token = sessionToken || localToken

  return token
}

const authenticatedFetch = async (url, options = {}) => {
  const token = getToken()

  const headers = {
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` })
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  async getDocuments(limit = 100, skip = 0) {
    const params = new URLSearchParams({ limit, skip })
    return authenticatedFetch(`${API_BASE_URL}/documents?${params.toString()}`)
  },

  async getRecentDocuments(limit = 10, skip = 0) {
    const params = new URLSearchParams({ limit, skip })
    return authenticatedFetch(`${API_BASE_URL}/documents/recent?${params.toString()}`)
  },

  async getDocument(id) {
    return authenticatedFetch(`${API_BASE_URL}/documents/${id}`)
  },

  async deleteDocument(id) {
    return authenticatedFetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    })
  },

  async renameDocument(id, displayName) {
    return authenticatedFetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ display_name: displayName }),
    })
  },

  async searchDocuments(query = '', documentType = null, status = null, limit = 20) {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (documentType) params.append('document_type', documentType)
    if (status) params.append('status', status)
    params.append('limit', limit)
    return authenticatedFetch(`${API_BASE_URL}/documents/search?${params.toString()}`)
  },

  async uploadDocument(file) {
    const formData = new FormData()
    formData.append('file', file)

    const token = getToken()
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(error.detail || error.message || 'Failed to upload document')
    }

    return response.json()
  },

  async startScan(config) {
    return authenticatedFetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
  },

  async performOcr(documentId, config) {
    return authenticatedFetch(`${API_BASE_URL}/ocr/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
  },

  async getScanProfiles() {
    return authenticatedFetch(`${API_BASE_URL}/scan-profiles`)
  },

  async getScanProfile(id) {
    return authenticatedFetch(`${API_BASE_URL}/scan-profiles/${id}`)
  },

  async createScanProfile(profile) {
    return authenticatedFetch(`${API_BASE_URL}/scan-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })
  },

  async updateScanProfile(id, profile) {
    return authenticatedFetch(`${API_BASE_URL}/scan-profiles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })
  },

  // Scan Profiles - Supprimer un profil
  async deleteScanProfile(id) {
    return authenticatedFetch(`${API_BASE_URL}/scan-profiles/${id}`, {
      method: 'DELETE',
    })
  },

  // Bannettes - Récupérer toutes les bannettes
  async getBannettes() {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/`)
  },

  // Bannettes - Récupérer une bannette
  async getBannette(id) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/${id}/`)
  },

  // Bannettes - Créer une nouvelle bannette
  async createBannette(data) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Bannettes - Mettre à jour une bannette
  async updateBannette(id, data) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Bannettes - Supprimer une bannette
  async deleteBannette(id) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/${id}/`, {
      method: 'DELETE',
    })
  },

  // Bannettes - Créer une bannette par défaut
  async createDefaultBannette() {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/default`, {
      method: 'POST',
    })
  },

  // Documents - Récupérer les documents d'une bannette
  async getDocumentsByBannette(bannetteId, limit = 100, skip = 0) {
    const params = new URLSearchParams({ limit, skip })
    return authenticatedFetch(`${API_BASE_URL}/documents/by-bannette/${bannetteId}?${params.toString()}`)
  },

  async uploadCroppedImage(canvas, filename) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        const file = new File([blob], filename, { type: 'image/jpeg' })
        const formData = new FormData()
        formData.append('file', file)

        const token = getToken()

        try {
          const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            credentials: 'include', // Important: Envoie les cookies HttpOnly
            headers: {
              ...(token && { Authorization: `Bearer ${token}` })
            },
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }))
            throw new Error(error.detail || error.message || 'Failed to upload cropped image')
          }

          const result = await response.json()
          const fileUrl = result.document?.url || result.url || `${API_BASE_URL}/uploads/${result.document?.filename || result.filename}`
          resolve(fileUrl.startsWith('/') ? `${API_BASE_URL}${fileUrl}` : fileUrl)
        } catch (error) {
          reject(error)
        }
      }, 'image/jpeg', 0.95)
    })
  },
}
