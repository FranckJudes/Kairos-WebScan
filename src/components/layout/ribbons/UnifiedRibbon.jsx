import { useState, useMemo } from 'react'
import { useScanProfiles } from '../../../hooks/useScanProfiles'
import { useScanSettings } from '../../../hooks/useScanSettings'
import { useScanners, useScan } from '../../../hooks/useScanners'
import { useDocuments } from '../../../contexts/DocumentsContext'

function UnifiedRibbon() {
  const [selectedScanner, setSelectedScanner] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [manualOverrides, setManualOverrides] = useState({})

  const { data: scanners = [], isLoading: scannersLoading, error: scannersError } = useScanners('ALL')
  const { profiles, isLoading: profilesLoading } = useScanProfiles()
  const { scanSettings } = useScanSettings(selectedProfileId)
  const scanMutation = useScan()
  const { addDocuments, documents: existingDocuments, setDocuments, setSelectedDocumentId, setSelectedPageNumber } = useDocuments()

  useMemo(() => {
    if (scanners.length > 0 && !selectedScanner) {
      setSelectedScanner(scanners[0].id)
    }
  }, [scanners])

  const currentSettings = useMemo(() => {
    return {
      paperSize: manualOverrides.paperSize || scanSettings.paperSize,
      scanMode: manualOverrides.scanMode || scanSettings.scanMode,
      resolution: manualOverrides.resolution || scanSettings.resolution,
      brightness: manualOverrides.brightness ?? scanSettings.brightness,
      contrast: manualOverrides.contrast ?? scanSettings.contrast,
    }
  }, [scanSettings, manualOverrides])

  const updateSetting = (key, value) => {
    setManualOverrides(prev => ({ ...prev, [key]: value }))
  }

  const handleProfileChange = (newProfileId) => {
    setSelectedProfileId(newProfileId)
    setManualOverrides({})
  }

  const handleScan = async () => {
    if (!selectedScanner) return
    const scanProfile = { ...scanSettings, ...manualOverrides }
    try {
      const result = await scanMutation.mutateAsync({
        profile: scanProfile,
        scannerId: selectedScanner,
      })
      if (result?.documents && result.documents.length > 0) {
        const lastDoc = existingDocuments[existingDocuments.length - 1]
        const now = new Date()
        const lastDocTime = lastDoc ? new Date(lastDoc.createdAt) : null
        const isRecent = lastDocTime && (now - lastDocTime) < 5 * 60 * 1000
        if (lastDoc && lastDoc.pages && isRecent) {
          const currentPageCount = lastDoc.pages.length
          const newPages = result.documents[0].pages.map((page, index) => ({
            ...page,
            pageNumber: currentPageCount + index + 1,
          }))
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === lastDoc.id
                ? { ...doc, pages: [...doc.pages, ...newPages], numPages: doc.pages.length + newPages.length }
                : doc
            )
          )
        } else {
          setDocuments((prev) => [...prev, ...result.documents])
          setSelectedDocumentId(result.documents[0].id)
          setSelectedPageNumber(1)
        }
      }
    } catch (error) {
      console.error('Scan failed:', error)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    addDocuments(files)
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
            {profilesLoading ? (
              <span className="text-[10px] text-gray-500">Chargement...</span>
            ) : (
              <select
                className="text-[11px] py-0.5 px-2 bg-white dark:bg-dark-bg border-[#edebe9] dark:border-dark-border rounded focus:ring-1 focus:ring-[#106EBE] dark:focus:ring-blue-500 text-[#605e5c] dark:text-dark-text w-full"
                value={selectedProfileId}
                onChange={(e) => handleProfileChange(e.target.value)}
              >
                <option value="">-- Select Profile --</option>
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

          <label className="cursor-pointer bg-gray-700 text-white hover:bg-gray-800 px-4 py-3 rounded shadow-lg flex items-center space-x-2 transition-all">
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span className="font-semibold text-[12px]">Importer</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.webp"
              multiple
              onChange={handleFileSelect}
            />
          </label>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-dark-textTertiary mt-auto py-0.5">Actions</span>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>
    </div>
  )
}

export default UnifiedRibbon
