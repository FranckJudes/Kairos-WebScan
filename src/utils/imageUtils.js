// Convertir une image base64 en Blob
export function base64ToBlob(base64, mimeType = 'image/jpeg') {
  const byteCharacters = atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: mimeType })
}

// Créer un fichier à partir de données base64
export function base64ToFile(base64, filename, mimeType = 'image/jpeg') {
  const blob = base64ToBlob(base64, mimeType)
  return new File([blob], filename, { type: mimeType })
}

// Créer une URL objet à partir de base64 (pour affichage temporaire)
export function base64ToUrl(base64, mimeType = 'image/jpeg') {
  const blob = base64ToBlob(base64, mimeType)
  return URL.createObjectURL(blob)
}

// Extraire le type MIME à partir du format
export function getMimeTypeFromFormat(format) {
  const formatMap = {
    'JPEG': 'image/jpeg',
    'JPG': 'image/jpeg',
    'PNG': 'image/png',
    'TIFF': 'image/tiff',
    'BMP': 'image/bmp',
    'PDF': 'application/pdf',
  }
  return formatMap[format?.toUpperCase()] || 'image/jpeg'
}
