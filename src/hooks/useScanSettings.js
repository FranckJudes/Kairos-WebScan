import { useMemo } from 'react'
import { useScanProfile } from './useScanProfiles'

// Valeurs par défaut
const DEFAULT_SETTINGS = {
  paperSize: 'A4',
  scanMode: 'Color',
  resolution: '300',
  horizontalAlign: 'center',
  scale: '100%',
  brightness: 50,
  contrast: 50,
  blankPage: '0',
  sensibility: '',
}

export const useScanSettings = (selectedProfileId) => {
  const { data: profile, isLoading, error } = useScanProfile(selectedProfileId)

  const scanSettings = useMemo(() => {
    if (!profile) {
      return DEFAULT_SETTINGS
    }

    return {
      paperSize: profile.paper_size || DEFAULT_SETTINGS.paperSize,
      scanMode: DEFAULT_SETTINGS.scanMode, // Mode non stocké dans le profil pour l'instant
      resolution: profile.resolution?.toString() || DEFAULT_SETTINGS.resolution,
      horizontalAlign: profile.horizontal_align || DEFAULT_SETTINGS.horizontalAlign,
      scale: profile.scale || DEFAULT_SETTINGS.scale,
      brightness: profile.brightness || profile.brithness || DEFAULT_SETTINGS.brightness,
      contrast: profile.contrast || DEFAULT_SETTINGS.contrast,
      blankPage: profile.blank_page || profile.blanck_page || DEFAULT_SETTINGS.blankPage,
      sensibility: profile.sensibility || DEFAULT_SETTINGS.sensibility,
    }
  }, [profile])

  return {
    scanSettings,
    isLoading,
    error,
    profile,
  }
}
