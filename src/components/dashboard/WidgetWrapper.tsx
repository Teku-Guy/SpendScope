import React, { memo } from 'react'
import { cn } from '@/lib/utils'
import { Widget, WidgetConfig } from '@/lib/widgets/types'
import { Settings, Grip, X } from 'lucide-react'
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
  return (
    <div
      className={cn(
        // Base widget styling
        'relative h-full w-full',
        'apple-card apple-blur',
        'transition-all duration-300 ease-out',

        // Edit mode styling
        isEditMode && [
          'ring-2 ring-blue-500/30',
          'shadow-lg shadow-blue-500/20',
          'hover:ring-blue-500/50',
          'hover:shadow-xl hover:shadow-blue-500/30'
        ],

        // Default mode styling
        !isEditMode && [
          'hover:shadow-medium',
          'hover:scale-[1.02]'
        ]
      )}
      key={refreshKey}
    >
      {/* Edit Mode Controls */}
      {isEditMode && (
        <>
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-10">
            <div className={cn(
              'flex items-center justify-center',
              'w-6 h-6 rounded-md',
              'bg-muted/80 hover:bg-muted',
              'text-muted-foreground hover:text-foreground',
              'transition-all duration-200',
              'cursor-move'
            )}>
              <Grip className="w-3 h-3" />
            </div>
          </div>

          {/* Widget Controls */}
          <div className="absolute top-2 right-2 z-10 flex space-x-1">
            {/* Configure Button */}
            {widget.configurable && onConfigOpen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onConfigOpen}
                className={cn(
                  'w-6 h-6 p-0',
                  'bg-muted/80 hover:bg-muted',
                  'text-muted-foreground hover:text-foreground'
                )}
              >
                <Settings className="w-3 h-3" />
              </Button>
            )}

            {/* Remove Button */}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className={cn(
                  'w-6 h-6 p-0',
                  'bg-destructive/80 hover:bg-destructive',
                  'text-destructive-foreground hover:text-white'
                )}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Widget Info Overlay */}
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <div className={cn(
              'bg-background/95 backdrop-blur-sm',
              'border border-border/50',
              'rounded-lg px-3 py-2',
              'shadow-sm'
            )}>
              <h3 className="text-sm font-medium text-foreground">
                {widget.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {widget.description}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Widget Content */}
      <div className={cn(
        'h-full w-full',
        'overflow-hidden',
        isEditMode && 'pointer-events-none'
      )}>
        {children}
      </div>

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-background/5 pointer-events-none" />
      )}
    </div>
  )
})

WidgetWrapper.displayName = 'WidgetWrapper'