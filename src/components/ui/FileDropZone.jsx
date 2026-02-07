import { useCallback, useState } from 'react'

function FileDropZone({ onDrop, children, className = '' }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter(
        (file) => file.type.startsWith('image/') || file.type === 'application/pdf'
      )

      if (imageFiles.length > 0) {
        onDrop(imageFiles)
      }
    },
    [onDrop]
  )

  return (
    <div
      className={`transition-all ${isDragging ? 'ring-4 ring-[#106EBE] bg-blue-50' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  )
}

export default FileDropZone
