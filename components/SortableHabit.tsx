import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

export function SortableHabit({ id, children, isEditMode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 1000 : 1
    }

    return (
        <div ref={setNodeRef} style={style}>
            {isEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        cursor: 'grab',
                        padding: '4px',
                        color: 'rgba(0,0,0,0.3)'
                    }}
                >
                    <GripVertical size={16} />
                </div>
            )}
            {children}
        </div>
    )
}
