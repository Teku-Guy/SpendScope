'use client'

import React, { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/Sheet'
import {
  getAllWidgets,
  getWidgetsByCategory,
  type Widget
} from '@/lib/widgets/registry'
import {
  Plus,
  Search,
  Grid,
  Calendar,
  Target,
  TrendingUp,
  List,
  Building,
  Brain,
  PieChart,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryIcons = {
  overview: Sparkles,
  analytics: TrendingUp,
  budget: Target,
  transactions: List,
  accounts: Building
}

const categoryColors = {
  overview: 'bg-blue-500/10 text-blue-700 border-blue-200',
  analytics: 'bg-green-500/10 text-green-700 border-green-200',
  budget: 'bg-purple-500/10 text-purple-700 border-purple-200',
  transactions: 'bg-orange-500/10 text-orange-700 border-orange-200',
  accounts: 'bg-indigo-500/10 text-indigo-700 border-indigo-200'
}

interface WidgetLibraryProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  isPanel?: boolean
}

export function WidgetLibrary({ isOpen, onOpenChange, isPanel = false }: WidgetLibraryProps) {
  const { addWidget, currentLayout, isEditMode } = useDashboard()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [internalOpen, setInternalOpen] = useState(false)

  const open = isOpen !== undefined ? isOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const allWidgets = getAllWidgets()
  const categories = ['all', 'overview', 'analytics', 'budget', 'transactions', 'accounts']

  // Filter widgets
  const filteredWidgets = useMemo(() => {
    let widgets = allWidgets

    // Filter by category
    if (selectedCategory !== 'all') {
      widgets = getWidgetsByCategory(selectedCategory as Widget['category'])
    }

    // Filter by search term
    if (searchTerm) {
      widgets = widgets.filter(widget =>
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter out disabled widgets
    widgets = widgets.filter(widget => !widget.disabled)

    return widgets
  }, [allWidgets, selectedCategory, searchTerm])

  // Get widgets that are already on the dashboard
  const usedWidgetIds = useMemo(() => {
    return new Set(currentLayout.map(item => item.i))
  }, [currentLayout])

  const handleAddWidget = (widget: Widget) => {
    if (usedWidgetIds.has(widget.id)) {
      return // Widget already on dashboard
    }

    // Find a good position for the new widget
    const maxY = currentLayout.length > 0 ? Math.max(...currentLayout.map(item => item.y + item.h)) : 0

    addWidget(widget.id, { x: 0, y: maxY })

    // Don't close panel in panel mode, only close sheet
    if (!isPanel) {
      setOpen(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, widget: Widget) => {
    if (usedWidgetIds.has(widget.id)) {
      e.preventDefault()
      return
    }

    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'widget',
      widget: widget
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const getWidgetIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Sparkles,
      Building,
      Calendar,
      Target,
      Brain,
      TrendingUp,
      PieChart,
      List,
      Grid
    }
    const Icon = icons[iconName] || Grid
    return <Icon className="w-5 h-5" />
  }

  // Panel mode renders content directly without Sheet wrapper
  const renderContent = () => (
    <>
      {/* Search and Filters */}
      <div className="space-y-4 pb-4 border-b">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Grid
            const isSelected = selectedCategory === category

            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'gap-2 capitalize text-xs h-7',
                  !isSelected && category !== 'all' && categoryColors[category as keyof typeof categoryColors]
                )}
              >
                {category !== 'all' && <Icon className="w-3 h-3" />}
                {category === 'all' ? 'All' : category}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Widget Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-3 py-4">
          {filteredWidgets.map((widget) => {
            const isUsed = usedWidgetIds.has(widget.id)
            const Icon = categoryIcons[widget.category] || Grid

            return (
              <div
                key={widget.id}
                draggable={!isUsed && isEditMode}
                onDragStart={(e) => handleDragStart(e, widget)}
                className={cn(
                  'p-3 rounded-lg border transition-all duration-200',
                  isUsed
                    ? 'border-muted bg-muted/50 opacity-60'
                    : 'border-border hover:border-primary/50 hover:shadow-sm cursor-pointer',
                  !isUsed && isEditMode && 'hover:scale-[1.01]'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      'p-1.5 rounded-md',
                      widget.category && categoryColors[widget.category]
                    )}>
                      {getWidgetIcon(widget.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{widget.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs capitalize h-5',
                        widget.category && categoryColors[widget.category]
                      )}
                    >
                      <Icon className="w-2 h-2 mr-1" />
                      {widget.category}
                    </Badge>
                    {widget.configurable && (
                      <Badge variant="outline" className="text-xs h-5">
                        Config
                      </Badge>
                    )}
                  </div>

                  {isUsed ? (
                    <Badge variant="secondary" className="text-xs h-5">
                      Added
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAddWidget(widget)}
                      disabled={!isEditMode}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filteredWidgets.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Grid className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No widgets found</p>
            <p className="text-xs">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </>
  )

  // Panel mode returns content directly
  if (isPanel) {
    return <div className="flex flex-col h-full">{renderContent()}</div>
  }

  // Sheet mode returns the full Sheet component
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 bg-background/95 backdrop-blur-sm border-border/50',
            !isEditMode && 'opacity-50 cursor-not-allowed'
          )}
          disabled={!isEditMode}
        >
          <Plus className="w-4 h-4" />
          Add Widget
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[400px] sm:w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Grid className="w-5 h-5" />
            Widget Library
          </SheetTitle>
        </SheetHeader>

        {renderContent()}

        {/* Drag & Drop Instructions - Only show in sheet mode */}
        {isEditMode && (
          <div className="pt-4 border-t bg-muted/30 -mx-6 px-6 pb-6">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">💡 Pro Tips:</p>
              <ul className="space-y-1">
                <li>• Click &quot;Add&quot; to place widgets at the bottom</li>
                <li>• Drag widgets directly onto your dashboard</li>
                <li>• Widgets can be resized and repositioned after adding</li>
              </ul>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}