'use client'

import React, { useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/Button'
import { PresetSelector } from './PresetSelector'
import { WidgetLibrary } from './WidgetLibrary'
import { Grid3X3, Eye, Save, RotateCcw, Plus, X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export function CustomizationToggle() {
  const {
    isEditMode,
    setEditMode,
    isDirty,
    saveLayout,
    resetLayout
  } = useDashboard()

  const { addToast } = useToast()
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)

  const handleToggleEdit = () => {
    setEditMode(!isEditMode)
    if (!isEditMode) {
      setShowWidgetPanel(false)
    }
  }

  const handleToggleWidgetPanel = () => {
    if (!isEditMode) {
      setEditMode(true)
    }
    setShowWidgetPanel(!showWidgetPanel)
  }

  const handleSave = async () => {
    try {
      await saveLayout()
      addToast({
        type: 'success',
        title: 'Layout Saved',
        description: 'Your dashboard layout has been saved successfully.'
      })
    } catch (error) {
      console.error('Failed to save layout:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Unable to save your dashboard layout. Please try again.'
      })
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the dashboard to default layout? This will remove all customizations.')) {
      try {
        resetLayout()
        addToast({
          type: 'success',
          title: 'Layout Reset',
          description: 'Your dashboard has been reset to the default layout.'
        })
      } catch (error) {
        console.error('Failed to reset layout:', error)
        addToast({
          type: 'error',
          title: 'Reset Failed',
          description: 'Unable to reset your dashboard layout. Please try again.'
        })
      }
    }
  }

  return (
    <>
      {/* Top Control Bar - Mobile responsive */}
      <div className="mb-4 sm:mb-6">
        {/* Mobile: Stacked layout */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <Button
              onClick={handleToggleEdit}
              size="sm"
              variant={isEditMode ? "default" : "outline"}
              className={cn(
                isEditMode
                  ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                  : 'hover:bg-accent'
              )}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>

          {/* Mobile Edit Mode Controls */}
          {isEditMode && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Edit Mode</span>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  onClick={handleToggleWidgetPanel}
                  size="sm"
                  variant="outline"
                  className={cn(
                    'text-xs px-2',
                    'border-dashed border-2',
                    showWidgetPanel
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50 text-muted-foreground hover:text-primary'
                  )}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>

                <PresetSelector />

                {isDirty && (
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                )}

                <Button
                  onClick={handleReset}
                  size="sm"
                  variant="outline"
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive text-xs px-2"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            {isEditMode && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Edit Mode</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Add Widget Button - Only visible when in edit mode */}
            {isEditMode && (
              <Button
                onClick={handleToggleWidgetPanel}
                size="sm"
                variant="outline"
                className={cn(
                  'border-dashed border-2',
                  showWidgetPanel
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-primary'
                )}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Widget
              </Button>
            )}

            {/* Preset Selector */}
            <PresetSelector />

            {/* Edit Mode Actions */}
            {isEditMode && (
              <div className="flex items-center space-x-2">
                {/* Save Button */}
                {isDirty && (
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                )}

                {/* Reset Button */}
                <Button
                  onClick={handleReset}
                  size="sm"
                  variant="outline"
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}

            {/* Main Edit Layout Button */}
            <Button
              onClick={handleToggleEdit}
              size="sm"
              variant={isEditMode ? "default" : "outline"}
              className={cn(
                isEditMode
                  ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                  : 'hover:bg-accent'
              )}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Done
                </>
              ) : (
                <>
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Edit Layout
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-out Widget Panel */}
      {showWidgetPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setShowWidgetPanel(false)}
          />

          {/* Panel - Responsive width */}
          <div className={cn(
            'fixed top-0 right-0 h-full z-50',
            'w-full sm:w-80 md:w-96', // Full width on mobile, narrower on larger screens
            'bg-card border-l border-border shadow-2xl',
            'transform transition-transform duration-300 ease-out',
            'overflow-hidden flex flex-col'
          )}>
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Add Widgets</h2>
                <p className="text-sm text-muted-foreground">Drag widgets to your dashboard</p>
              </div>
              <Button
                onClick={() => setShowWidgetPanel(false)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-auto p-4">
              <WidgetLibrary isPanel={true} />
            </div>

            {/* Panel Footer */}
            <div className="border-t border-border p-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Settings className="w-4 h-4 mr-2" />
                <span>Drag widgets onto your dashboard to add them</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Mode Backdrop - Subtle overlay to focus attention */}
      {isEditMode && (
        <div className="fixed inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 bg-background/10 backdrop-blur-[0.5px]" />
        </div>
      )}
    </>
  )
}