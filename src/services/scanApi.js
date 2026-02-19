const SCAN_API_BASE_URL = import.meta.env.VITE_SCAN_API_URL;

// Constants pour les paramètres de scan WIA
export const ScanSource = {
  FLATBED: 0,
  FEEDER: 1,
  DUPLEX: 2,
}

export const ColorMode = {
  BLACK_WHITE: 0,
  GRAYSCALE: 1,
  COLOR: 2,
  WIA_COLOR: 4,
}

export const PaperSize = {
  DEFAULT: 0,
  A4: 1,
  JISB5: 2,
  USLETTER: 3,
  USLEGAL: 4,
  A5: 5,
  B4: 6,
  B6: 7,
  A3: 8,
}

export const scanApi = {
  // Récupérer la liste des scanners
  async getScanners(scannerType = 'ALL') {
    try {
      const response = await fetch(`${SCAN_API_BASE_URL}/api/Scanner/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scannerType }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch scanners: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  },

  // Numériser des documents avec WIA
  async scan(config) {
    try {
      const response = await fetch(`${SCAN_API_BASE_URL}/api/WiaScanner/scan-alternative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.errorMessage || `Failed to scan: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw error
    }
  },

  // Convertir les paramètres du profil vers le format attendu par l'API WIA
  mapScanRequest(profile, scannerId) {
    return {
      scannerId: scannerId,
      source: ScanSource.DUPLEX, // Par défaut duplex
      colorMode: this.mapColorMode(profile.scanMode),
      resolution: parseInt(profile.resolution),
      paperSize: this.mapPaperSize(profile.paperSize),
      brightness: parseInt(profile.brightness) || 0,
      contrast: parseInt(profile.contrast) || 0,
      blankPageDetection: profile.blankPage === '1',
      blankPageThreshold: parseInt(profile.sensibility) || 95,
    }
  },

  // Mapper le mode couleur pour WIA
  mapColorMode(scanMode) {
    const modeMap = {
      'Black & White': ColorMode.BLACK_WHITE,
      'Grayscale': ColorMode.GRAYSCALE,
      'Color': ColorMode.WIA_COLOR, // Utiliser 4 pour WIA
    }
    return modeMap[scanMode] || ColorMode.WIA_COLOR
  },

  // Mapper le format papier
  mapPaperSize(paperSize) {
    const sizeMap = {
      'A4': PaperSize.A4,
      'A3': PaperSize.A3,
      'Letter': PaperSize.USLETTER,
      'Legal': PaperSize.USLEGAL,
      'A5': PaperSize.A5,
    }
    return sizeMap[paperSize] || PaperSize.A4
  },
}
