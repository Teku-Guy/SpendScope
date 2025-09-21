import React, { memo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Widget, WidgetConfig } from '@/lib/widgets/types'
import { Settings, GripVertical, X, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface WidgetWrapperProps {
  widget: Widget
  config?: WidgetConfig
  isEditMode?: boolean
  onConfigOpen?: () => void
  onRemove?: () => void
  children: React.ReactNode
  refreshKey?: number
}

export const WidgetWrapper = memo<WidgetWrapperProps>(({
  widget,
  config = {},
  isEditMode = false,
  onConfigOpen,
  onRemove,
  children,
  refreshKey
}) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div
      className={cn(
        // Base widget styling
        'relative h-full w-full',
        'bg-card border border-border rounded-lg',
        'shadow-sm',
        'transition-all duration-300 ease-out',

        // Edit mode styling
        isEditMode && [
          'ring-2 ring-blue-500/30',
          'border-blue-500/50',
          'shadow-lg shadow-blue-500/10',
          'transform-gpu'
        ],

        // Default mode styling
        !isEditMode && [
          'hover:border-primary/30',
          'hover:shadow-md hover:shadow-primary/5'
        ]
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      key={refreshKey}
    >
      {/* Edit Mode Controls - Fade in with smooth animations */}
      {isEditMode && (
        <>
          {/* Drag Handle - Apple-inspired design */}
          <div
            className={cn(
              'absolute top-3 left-3 z-10 widget-drag-handle',
              'transition-all duration-300 ease-out',
              isHovered ? 'opacity-100 scale-100' : 'opacity-70 scale-95'
            )}
          >
            <div className={cn(
              'flex items-center justify-center',
              'w-7 h-7 rounded-full',
              'bg-background/95 backdrop-blur-sm',
              'border border-border/50',
              'shadow-lg shadow-black/5',
              'text-muted-foreground hover:text-foreground',
              'transition-all duration-200 ease-out',
              'cursor-move hover:scale-105 hover:shadow-xl',
              'group'
            )}>
              <GripVertical className={cn(
                'w-3.5 h-3.5',
                'transition-transform duration-200',
                'group-hover:scale-110'
              )} />
            </div>
          </div>

          {/* Widget Controls - Right side with slide-in animation */}
          <div className={cn(
            'absolute top-3 right-3 z-10',
            'flex items-center space-x-1',
            'transition-all duration-300 ease-out transform',
            isHovered ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-70'
          )}>
            {/* Configure Button */}
            {widget.configurable && onConfigOpen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onConfigOpen}
                className={cn(
                  'w-7 h-7 p-0 rounded-full',
                  'bg-background/95 backdrop-blur-sm',
                  'border border-border/50 shadow-lg shadow-black/5',
                  'text-muted-foreground hover:text-foreground',
                  'hover:scale-105 hover:shadow-xl',
                  'transition-all duration-200 ease-out'
                )}
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
            )}

            {/* Remove Button - Subtle red accent */}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className={cn(
                  'w-7 h-7 p-0 rounded-full',
                  'bg-background/95 backdrop-blur-sm',
                  'border border-red-200/50 shadow-lg shadow-red-500/5',
                  'text-red-500 hover:text-white',
                  'hover:bg-red-500 hover:border-red-500',
                  'hover:scale-105 hover:shadow-xl hover:shadow-red-500/20',
                  'transition-all duration-200 ease-out'
                )}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {/* Widget Info Badge - Minimalist bottom indicator */}
          <div className={cn(
            'absolute bottom-3 left-3 z-10',
            'transition-all duration-300 ease-out',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'
          )}>
            <div className={cn(
              'flex items-center space-x-2 px-3 py-1.5',
              'bg-background/95 backdrop-blur-sm',
              'border border-border/50 shadow-lg shadow-black/5',
              'rounded-full'
            )}>
              <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {widget.name}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Widget Content - Subtle dimming in edit mode */}
      <div className={cn(
        'h-full w-full overflow-hidden',
        'transition-all duration-300 ease-out',
        isEditMode && [
          'pointer-events-none',
          'opacity-60',
          'grayscale-[20%]'
        ]
      )}>
        {children}
      </div>

      {/* Edit Mode Overlay - Gentle blur effect */}
      {isEditMode && (
        <div className={cn(
          'absolute inset-0 pointer-events-none',
          'bg-background/5 backdrop-blur-[0.5px]',
          'transition-all duration-300 ease-out'
        )} />
      )}
    </div>
  )
})

WidgetWrapper.displayName = 'WidgetWrapper'