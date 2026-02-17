import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import PageThumbnail from './PageThumbnail'

function DraggablePageThumbnail({ id, url, pageNumber, originalPageNumber, isSelected, isCheckboxSelected, onCheckboxToggle, onClick, isPdf, disabled }) {
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
        className={`relative group ${isCheckboxSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-dark-bg rounded-sm' : ''}`}
        {...(!disabled && { ...attributes, ...listeners })}
      >
        {/* Checkbox */}
        <div className="absolute top-1 left-1 z-10">
          <input
            type="checkbox"
            checked={isCheckboxSelected}
            onChange={(e) => {
              e.stopPropagation()
              onCheckboxToggle()
            }}
            className="w-4 h-4 rounded border-gray-300 text-[#106EBE] focus:ring-[#106EBE] cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <PageThumbnail
          url={url}
          pageNumber={pageNumber}
          originalPageNumber={originalPageNumber}
          isSelected={isSelected}
          onClick={onClick}
          isPdf={isPdf}
          hasCheckbox={true}
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
