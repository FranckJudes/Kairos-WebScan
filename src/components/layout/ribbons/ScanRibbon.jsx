import { useState, useMemo } from 'react'
import { useScanProfiles } from '../../../hooks/useScanProfiles'
import { useScanSettings } from '../../../hooks/useScanSettings'
import { useScanners, useScan } from '../../../hooks/useScanners'
import { useDocuments } from '../../../contexts/DocumentsContext'

function ScanRibbon() {
  // États existants
  const [selectedScanner, setSelectedScanner] = useState('')

  // État pour le profil sélectionné
  const [selectedProfileId, setSelectedProfileId] = useState('')

  // État pour les overrides manuels (quand l'utilisateur modifie manuellement)
  const [manualOverrides, setManualOverrides] = useState({})

  // Récupérer la liste des scanners depuis le backend
  const { data: scanners = [], isLoading: scannersLoading, error: scannersError } = useScanners('ALL')

  // Récupérer la liste des profils
  const { profiles, isLoading: profilesLoading, error: profilesError } = useScanProfiles()

  // Récupérer les paramètres du profil sélectionné avec React Query
  const { scanSettings, isLoading: settingsLoading } = useScanSettings(selectedProfileId)

  // Mutation pour lancer un scan
  const scanMutation = useScan()

  // Récupérer la fonction pour ajouter des documents
  const { addDocuments, documents: existingDocuments, setDocuments, setSelectedDocumentId, setSelectedPageNumber } = useDocuments()

  // Trouver le scanner sélectionné
  const selectedScannerData = scanners.find(s => s.id === selectedScanner)

  // Sélectionner le premier scanner par défaut quand ils sont chargés
  useMemo(() => {
    if (scanners.length > 0 && !selectedScanner) {
      setSelectedScanner(scanners[0].id)
    }
  }, [scanners])

  // Fusionner les paramètres du profil avec les overrides manuels
  const currentSettings = useMemo(() => {
    return {
      paperSize: manualOverrides.paperSize || scanSettings.paperSize,
      scanMode: manualOverrides.scanMode || scanSettings.scanMode,
      resolution: manualOverrides.resolution || scanSettings.resolution,
      horizontalAlign: manualOverrides.horizontalAlign || scanSettings.horizontalAlign,
      scale: manualOverrides.scale || scanSettings.scale,
      brightness: manualOverrides.brightness ?? scanSettings.brightness,
      contrast: manualOverrides.contrast ?? scanSettings.contrast,
      blankPage: manualOverrides.blankPage || scanSettings.blankPage,
      sensibility: manualOverrides.sensibility ?? scanSettings.sensibility,
    }
  }, [scanSettings, manualOverrides])

  // Handlers pour mettre à jour les valeurs
  const updateSetting = (key, value) => {
    setManualOverrides(prev => ({ ...prev, [key]: value }))
  }

  // Reset les overrides quand on change de profil
  const handleProfileChange = (newProfileId) => {
    setSelectedProfileId(newProfileId)
    setManualOverrides({})
  }

  // Gérer le clic sur le bouton SCAN
  const handleScan = async () => {
    if (!selectedScanner) {
      console.error('No scanner selected')
      return
    }

    // Fusionner les paramètres du profil avec les overrides manuels
    const scanProfile = {
      ...scanSettings,
      ...manualOverrides,
    }

    console.log('Starting scan with config:', {
      profile: scanProfile,
      scannerId: selectedScanner,
    })

    try {
      // Lancer le scan et récupérer les documents
      const result = await scanMutation.mutateAsync({
        profile: scanProfile,
        scannerId: selectedScanner,
      })

      // Ajouter les images scannées aux documents
      if (result?.documents && result.documents.length > 0) {
        const scannedDoc = result.documents[0]
        console.log('Scanned document:', scannedDoc)
        console.log('Current documents:', existingDocuments)

        // Vérifier si le dernier document est un document scanné (avec pages)
        // et a été créé il y a moins de 5 minutes
        const lastDoc = existingDocuments[existingDocuments.length - 1]
        const now = new Date()
        const lastDocTime = lastDoc ? new Date(lastDoc.createdAt) : null
        const isRecent = lastDocTime && (now - lastDocTime) < 5 * 60 * 1000 // 5 minutes

        if (lastDoc && lastDoc.pages && isRecent) {
          // Ajouter les pages au document existant
          console.log('Adding pages to existing document:', lastDoc.id)

          const currentPageCount = lastDoc.pages.length
          const newPages = scannedDoc.pages.map((page, index) => ({
            ...page,
            pageNumber: currentPageCount + index + 1,
          }))

          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === lastDoc.id
                ? {
                    ...doc,
                    pages: [...doc.pages, ...newPages],
                    numPages: doc.pages.length + newPages.length,
                    size: doc.size + scannedDoc.size,
                  }
                : doc
            )
          )

          console.log(`Added ${newPages.length} pages to document ${lastDoc.id}`)
        } else {
          // Créer un nouveau document
          console.log('Creating new document')
          const firstDocId = scannedDoc.id

          setDocuments((prev) => {
            const updatedDocuments = [...prev, ...result.documents]
            console.log('Updated documents:', updatedDocuments)
            return updatedDocuments
          })

          // Sélectionner automatiquement le premier document scanné
          setSelectedDocumentId(firstDocId)
          setSelectedPageNumber(1)

          console.log(`Created new document ${firstDocId}`)
        }
      } else {
        console.log('No documents in result:', result)
      }
    } catch (error) {
      console.error('Scan failed:', error)
      // Gérer l'erreur (afficher un message à l'utilisateur, etc.)
    }
  }

  return (
    <div className="h-24 bg-[#f3f2f1] dark:bg-dark-bg border-b border-[#edebe9] dark:border-dark-border flex items-stretch py-1.5 px-2 overflow-x-auto custom-scrollbar shrink-0 transition-colors duration-200">
      {/* Scanner Selection Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] dark:border-dark-border h-full min-w-[250px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text uppercase font-bold tracking-tight">Scanner</span>
            {scannersError ? (
              <span className="text-[10px] text-red-500 dark:text-red-400">Erreur de connexion</span>
            ) : (
              <select
                className="text-[11px] py-0.5 px-2 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
                value={selectedScanner}
                onChange={(e) => setSelectedScanner(e.target.value)}
                disabled={scannersLoading || scanners.length === 0}
              >
                {scannersLoading ? (
                  <option>Chargement...</option>
                ) : scanners.length === 0 ? (
                  <option>Aucun scanner détecté</option>
                ) : (
                  scanners.map((scanner) => (
                    <option key={scanner.id} value={scanner.id}>
                      {scanner.name}
                    </option>
                  ))
                )}
              </select>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${scannersError ? 'bg-red-400' : scanners.length > 0 ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
              <span className="text-[10px] text-[#605e5c] dark:text-dark-text">
                {scannersError ? 'Erreur' : scanners.length > 0 ? 'Prêt' : 'Attente'}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-dark-textTertiary mt-auto py-0.5">Scanner</span>
      </div>

      {/* Scan Profile Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] dark:border-dark-border h-full min-w-[200px]">
        <div className="flex flex-1 items-center space-x-4 px-2 w-full">
          <div className="flex flex-col space-y-1 flex-1">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text uppercase font-bold tracking-tight">Scan Profile</span>
            {profilesError ? (
              <span className="text-[10px] text-red-500 dark:text-red-400">Error loading profiles</span>
            ) : (
              <select
                className="text-[11px] py-0.5 px-2 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
                value={selectedProfileId}
                onChange={(e) => handleProfileChange(e.target.value)}
                disabled={profilesLoading}
              >
                <option value="">
                  {profilesLoading ? 'Loading...' : '-- Select Profile --'}
                </option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id?.toString()}>
                    {profile.libele}
                    {profile.default === '1' && ' (Default)'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-dark-textTertiary mt-auto py-0.5">Profile</span>
      </div>

      {/* Scan Settings Group */}
      <div className="flex flex-col items-center px-3 border-r border-[#edebe9] dark:border-dark-border h-full min-w-[400px]">
        <div className="flex flex-1 items-center space-x-3 px-2 w-full overflow-x-auto">
          <div className="flex flex-col space-y-1 flex-1 min-w-[80px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Paper</span>
            <select
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.paperSize}
              onChange={(e) => updateSetting('paperSize', e.target.value)}
            >
              <option>A4</option>
              <option>A3</option>
              <option>Letter</option>
              <option>Legal</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[80px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Mode</span>
            <select
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.scanMode}
              onChange={(e) => updateSetting('scanMode', e.target.value)}
            >
              <option>Color</option>
              <option>Grayscale</option>
              <option>Black & White</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[80px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Res (DPI)</span>
            <select
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.resolution}
              onChange={(e) => updateSetting('resolution', e.target.value)}
            >
              <option value="75">75</option>
              <option value="150">150</option>
              <option value="300">300</option>
              <option value="600">600</option>
              <option value="1200">1200</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[80px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Align</span>
            <select
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.horizontalAlign}
              onChange={(e) => updateSetting('horizontalAlign', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[70px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Scale</span>
            <select
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.scale}
              onChange={(e) => updateSetting('scale', e.target.value)}
            >
              <option value="50%">50%</option>
              <option value="75%">75%</option>
              <option value="100%">100%</option>
              <option value="125%">125%</option>
              <option value="150%">150%</option>
              <option value="200%">200%</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[70px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Bright</span>
            <input
              type="number"
              min="0"
              max="100"
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.brightness}
              onChange={(e) => updateSetting('brightness', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[70px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Contrast</span>
            <input
              type="number"
              min="0"
              max="100"
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.contrast}
              onChange={(e) => updateSetting('contrast', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[80px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Blank Pg</span>
            <select
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.blankPage}
              onChange={(e) => updateSetting('blankPage', e.target.value)}
            >
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>

          <div className="flex flex-col space-y-1 flex-1 min-w-[80px]">
            <span className="text-[10px] text-[#605e5c] dark:text-dark-text">Sensibility</span>
            <input
              type="text"
              className="text-[11px] py-0.5 px-1 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
              value={currentSettings.sensibility || ''}
              onChange={(e) => updateSetting('sensibility', e.target.value)}
              placeholder="Auto"
            />
          </div>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-dark-textTertiary mt-auto py-0.5">Settings</span>
      </div>

      {/* Scan Actions Group */}
      <div className="flex flex-col items-center px-3 h-full">
        <div className="flex space-x-2 flex-1 items-center">
          <button
            onClick={handleScan}
            disabled={!selectedScanner || scanMutation.isPending}
            className={`bg-[#106EBE] dark:bg-blue-600 hover:bg-[#005a9e] dark:hover:bg-blue-700 text-white px-6 py-3 rounded shadow-lg flex items-center space-x-2 transition-all ${
              scanMutation.isPending ? 'opacity-75 cursor-wait' : ''
            } ${!selectedScanner ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined">
              {scanMutation.isPending ? 'sync' : 'scanner'}
            </span>
            <span className="font-semibold text-[12px]">
              {scanMutation.isPending ? 'NUMÉRISATION...' : 'SCAN'}
            </span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">preview</span>
            <span className="text-[11px] mt-1">Preview</span>
          </button>
          <button className="flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#e1dfdd] dark:hover:bg-dark-hover transition-colors min-w-[56px]">
            <span className="material-symbols-outlined text-[24px]">settings</span>
            <span className="text-[11px] mt-1">Settings</span>
          </button>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-dark-textTertiary mt-auto py-0.5">Actions</span>
      </div>
    </div>
  )
}

export default ScanRibbon
