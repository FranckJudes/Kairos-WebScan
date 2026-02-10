import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageThumbnail from './PageThumbnail'

function DraggablePageThumbnail({ id, url, pageNumber, isSelected, onClick, isPdf, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="relative group"
        {...(!disabled && { ...attributes, ...listeners })}
      >
        <PageThumbnail
          url={url}
          pageNumber={pageNumber}
          isSelected={isSelected}
          onClick={onClick}
          isPdf={isPdf}
        />
        {/* Indicateur de drag - poignée */}
        {!disabled && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white rounded p-1 cursor-grab active:cursor-grabbing">
            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default DraggablePageThumbnail
