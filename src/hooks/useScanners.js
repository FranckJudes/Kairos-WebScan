import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scanApi } from '../services/scanApi'
import { getMimeTypeFromFormat } from '../utils/imageUtils'

const SCAN_API_BASE_URL = import.meta.env.VITE_SCAN_API_URL || 'http://192.168.100.12:5000'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const useScanners = (scannerType = 'ALL') => {
  return useQuery({
    queryKey: ['scanners', scannerType],
    queryFn: () => scanApi.getScanners(scannerType),
    staleTime: 1000 * 60 * 1,
    retry: 2,
  })
}

async function fetchImageFromPath(imagePath) {
  try {
    const proxyUrl = `${API_BASE_URL}/proxy/scan-image?path=${encodeURIComponent(imagePath)}`
    const response = await fetch(proxyUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()
    return blob
  } catch (error) {
    throw error
  }
}

export const useScan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ profile, scannerId }) => {
      const scanRequest = scanApi.mapScanRequest(profile, scannerId)
      const data = await scanApi.scan(scanRequest)
      const images = data.scannedImages || []

      if (data.success && images.length > 0) {
        const pages = images.map((img, index) => {
          const mimeType = getMimeTypeFromFormat(img.format)

          const backendPath = img.path.replace(/\\/g, '\\\\')
          const imageUrl = `${SCAN_API_BASE_URL}/api/WiaScanner/image?path=${encodeURIComponent(backendPath)}`


          return {
            pageNumber: index + 1,
            url: imageUrl,
            type: mimeType,
          }
        })

        const documentId = Date.now()
        const filename = `Scan_${new Date().toISOString().slice(0, 10)}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '-')}`

        const document = {
          id: documentId,
          name: filename,
          type: 'application/pdf', 
          size: 10000 * pages.length,
          url: pages[0].url, 
          pages: pages, 
          createdAt: new Date().toISOString(),
          numPages: pages.length,
        }


        pages.forEach((page, index) => {
          const img = new Image()
          img.src = page.url
          img.onload = () => {
          }
          img.onerror = () => {
          }
        })

        return { documents: [document], scanData: data }
      }

      return { documents: [], scanData: data }
    },
    onError: (error) => {
      throw error
    },
  })
}
