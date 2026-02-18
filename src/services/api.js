const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getToken = () => {
  const localToken = localStorage.getItem('token')
  const sessionToken = sessionStorage.getItem('token')
  const token = localToken || sessionToken

 
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
  async getDocuments() {
    return authenticatedFetch(`${API_BASE_URL}/documents`)
  },

  async getDocument(id) {
    return authenticatedFetch(`${API_BASE_URL}/documents/${id}`)
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

  // Example: Start scanning
  async startScan(config) {
    return authenticatedFetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
  },

  // Example: OCR a document
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

  // Scan Profiles - Créer un nouveau profil
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
    return authenticatedFetch(`${API_BASE_URL}/bannettes`)
  },

  // Bannettes - Récupérer une bannette
  async getBannette(id) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/${id}`)
  },

  // Bannettes - Créer une nouvelle bannette
  async createBannette(data) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Bannettes - Mettre à jour une bannette
  async updateBannette(id, data) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  },

  // Bannettes - Supprimer une bannette
  async deleteBannette(id) {
    return authenticatedFetch(`${API_BASE_URL}/bannettes/${id}`, {
      method: 'DELETE',
    })
  },

  // Upload une image rognée
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
