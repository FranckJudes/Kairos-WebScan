import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocuments } from '../../contexts/DocumentsContext'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Composant SortablePage pour une page avec drag & drop
function SortablePage({ page, index, removePage, rotatePage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const [rotation, setRotation] = useState(0)

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
    rotatePage(page.id, newRotation)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative bg-white rounded-lg shadow-sm border-2 transition-all cursor-move group ${
        isDragging ? 'border-[#106EBE] opacity-50 scale-95 z-50' : 'border-[#edebe9] hover:border-[#106EBE] hover:shadow-md'
      }`}
    >
      {/* Numéro d'ordre */}
      <div className="absolute top-2 left-2 bg-[#106EBE] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10 pointer-events-none">
        {index + 1}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
        <button
          onClick={handleRotate}
          className="bg-[#f3f2f1] hover:bg-[#106EBE] hover:text-white text-[#605e5c] p-1.5 rounded shadow-sm transition-colors"
          title="Rotation 90°"
        >
          <span className="material-symbols-outlined text-[14px]">rotate_right</span>
        </button>
        <button
          onClick={() => removePage(page.id)}
          className="bg-red-100 hover:bg-red-500 text-red-600 hover:text-white p-1.5 rounded shadow-sm transition-colors"
          title="Supprimer"
        >
          <span className="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>

      {/* Card Content */}
      <div className="p-3">
        {/* Thumbnail */}
        <div className="aspect-[3/4] bg-[#f3f2f1] rounded-lg mb-2 overflow-hidden relative pointer-events-none">
          <img
            src={page.url}
            alt={page.documentName}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
          />
        </div>

        {/* Document Info */}
        <div className="space-y-1 pointer-events-none">
          <h3 className="text-[10px] font-medium text-[#605e5c] truncate" title={page.documentName}>
            {page.documentName}
          </h3>
          <div className="flex items-center justify-between text-[9px] text-[#c8c6c4]">
            <span>Page {page.pageNumber}</span>
            <span>{(page.size / 1024).toFixed(0)} KB</span>
          </div>
        </div>
      </div>

      {/* Drag Handle Indicator */}
      <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-[#605e5c] text-xl">drag_indicator</span>
      </div>
    </div>
  )
}

function OrganizePage() {
  const navigate = useNavigate()
  const { documents } = useDocuments()

  // Configuration des capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Extraire toutes les pages de tous les documents
  const allPages = useMemo(() => {
    const pages = []
    documents.forEach((doc) => {
      // Document scanné avec des pages séparées (toujours des images)
      if (doc.pages && doc.pages.length > 0) {
        doc.pages.forEach((page) => {
          pages.push({
            id: `${doc.id}-page-${page.pageNumber}`,
            documentId: doc.id,
            documentName: doc.name,
            pageNumber: page.pageNumber,
            type: page.type || 'image/png',
            url: page.url,
            size: doc.size / doc.pages.length,
            rotation: 0,
          })
        })
      } else if (doc.type === 'application/pdf') {
        // Vrai PDF avec plusieurs pages
        const numPages = doc.numPages || 1
        for (let i = 1; i <= numPages; i++) {
          pages.push({
            id: `${doc.id}-page-${i}`,
            documentId: doc.id,
            documentName: doc.name,
            pageNumber: i,
            type: doc.type,
            url: doc.url,
            size: doc.size / numPages,
            rotation: 0,
          })
        }
      } else {
        // Image simple (une seule page)
        pages.push({
          id: `${doc.id}-page-1`,
          documentId: doc.id,
          documentName: doc.name,
          pageNumber: 1,
          type: doc.type,
          url: doc.url,
          size: doc.size,
          rotation: 0,
        })
      }
    })
    return pages
  }, [documents])

  const [orderedPages, setOrderedPages] = useState(allPages)

  // Mettre à jour les pages quand les documents changent
  useEffect(() => {
    setOrderedPages(allPages)
  }, [allPages])

  // Gestion de la fin du drag
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOrderedPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Supprimer une page
  const removePage = (pageId) => {
    setOrderedPages((prev) => prev.filter((page) => page.id !== pageId))
  }

  // Rotation d'une page
  const rotatePage = (pageId, rotation) => {
    setOrderedPages((prev) =>
      prev.map((page) =>
        page.id === pageId ? { ...page, rotation } : page
      )
    )
  }

  // Réinitialiser l'ordre
  const resetOrder = () => {
    setOrderedPages(allPages)
  }

  // Valider l'ordre et exporter
  const validateOrder = () => {
    console.log('Ordre validé:', orderedPages)
    // TODO: Créer un nouveau PDF avec l'ordre des pages
    alert('Ordre validé ! Fonctionnalité d\'export à venir.')
  }

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1]">
      {/* Header */}
      <div className="bg-white border-b border-[#edebe9] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-[#605e5c] hover:text-[#106EBE] transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Retour</span>
            </button>
            <div className="h-6 w-px bg-[#edebe9]"></div>
            <div>
              <h1 className="text-xl font-bold text-[#605e5c]">Organiser la découpe</h1>
              <p className="text-sm text-[#605e5c]">Glissez-déposez les pages pour les réorganiser</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-[#605e5c]">
              {orderedPages.length} page{orderedPages.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={resetOrder}
              className="bg-gray-200 hover:bg-gray-300 text-[#605e5c] px-4 py-2 rounded shadow flex items-center space-x-2 transition-all font-medium"
              disabled={orderedPages.length === allPages.length}
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>Réinitialiser</span>
            </button>
            <button
              onClick={validateOrder}
              className="bg-[#106EBE] hover:bg-[#005a9e] text-white px-6 py-2 rounded shadow-lg flex items-center space-x-2 transition-all font-medium"
            >
              <span className="material-symbols-outlined">check</span>
              <span>Valider l'ordre</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de pages */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        {orderedPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="material-symbols-outlined text-[80px] text-[#c8c6c4] mb-4">folder_open</span>
            <h2 className="text-xl font-semibold text-[#605e5c] mb-2">Aucune page</h2>
            <p className="text-sm text-[#605e5c]">Importez des documents pour commencer à organiser</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedPages.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {orderedPages.map((page, index) => (
                  <SortablePage
                    key={page.id}
                    page={page}
                    index={index}
                    removePage={removePage}
                    rotatePage={rotatePage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

export default OrganizePage
