

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = {
  async getDocuments() {
    const response = await fetch(`${API_BASE_URL}/documents`)
    if (!response.ok) {
      throw new Error('Failed to fetch documents')
    }
    return response.json()
  },

  // Example: Fetch a single document
  async getDocument(id) {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch document')
    }
    return response.json()
  },

  async uploadDocument(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      throw new Error('Failed to upload document')
    }
    return response.json()
  },

  // Example: Start scanning
  async startScan(config) {
    const response = await fetch(`${API_BASE_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    if (!response.ok) {
      throw new Error('Failed to start scan')
    }
    return response.json()
  },

  // Example: OCR a document
  async performOcr(documentId, config) {
    const response = await fetch(`${API_BASE_URL}/ocr/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    if (!response.ok) {
      throw new Error('Failed to perform OCR')
    }
    return response.json()
  },

  // Scan Profiles - Récupérer tous les profils
  async getScanProfiles() {
    const response = await fetch(`${API_BASE_URL}/scan-profiles`)
    if (!response.ok) {
      throw new Error('Failed to fetch scan profiles')
    }
    return response.json()
  },

  // Scan Profiles - Récupérer un profil spécifique
  async getScanProfile(id) {
    const response = await fetch(`${API_BASE_URL}/scan-profiles/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch scan profile')
    }
    return response.json()
  },

  // Scan Profiles - Créer un nouveau profil
  async createScanProfile(profile) {
    const response = await fetch(`${API_BASE_URL}/scan-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })
    if (!response.ok) {
      throw new Error('Failed to create scan profile')
    }
    return response.json()
  },

  // Scan Profiles - Mettre à jour un profil
  async updateScanProfile(id, profile) {
    const response = await fetch(`${API_BASE_URL}/scan-profiles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })
    if (!response.ok) {
      throw new Error('Failed to update scan profile')
    }
    return response.json()
  },

  // Scan Profiles - Supprimer un profil
  async deleteScanProfile(id) {
    const response = await fetch(`${API_BASE_URL}/scan-profiles/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete scan profile')
    }
    return response.json()
  },

  // Bannettes - Récupérer toutes les bannettes
  async getBannettes() {
    const response = await fetch(`${API_BASE_URL}/bannettes`)
    if (!response.ok) {
      throw new Error('Failed to fetch bannettes')
    }
    return response.json()
  },

  // Bannettes - Récupérer une bannette
  async getBannette(id) {
    const response = await fetch(`${API_BASE_URL}/bannettes/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch bannette')
    }
    return response.json()
  },

  // Bannettes - Créer une nouvelle bannette
  async createBannette(data) {
    const response = await fetch(`${API_BASE_URL}/bannettes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create bannette')
    }
    return response.json()
  },

  // Bannettes - Mettre à jour une bannette
  async updateBannette(id, data) {
    const response = await fetch(`${API_BASE_URL}/bannettes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to update bannette')
    }
    return response.json()
  },

  // Bannettes - Supprimer une bannette
  async deleteBannette(id) {
    const response = await fetch(`${API_BASE_URL}/bannettes/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete bannette')
    }
    return response.json()
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

        try {
          const response = await fetch(`${API_BASE_URL}/documents/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Failed to upload cropped image')
          }

          const result = await response.json()
          // Retourner l'URL complète du fichier uploadé
          const fileUrl = result.document?.url || result.url || `${API_BASE_URL}/uploads/${result.document?.filename || result.filename}`
          resolve(fileUrl.startsWith('/') ? `${API_BASE_URL}${fileUrl}` : fileUrl)
        } catch (error) {
          reject(error)
        }
      }, 'image/jpeg', 0.95)
    })
  },
}
