'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import {
  LayoutTemplate,
  Save,
  Download,
  Trash2,
  Star,
  Users,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Layout {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  updatedAt: string
}

interface Preset {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl?: string
  usageCount: number
  rating?: number
  ratingCount: number
  isPublic: boolean
  creator?: {
    id: string
    name: string
    image?: string
  }
}

export function PresetSelector() {
  const {
    currentLayout,
    widgetConfigs,
    loading,
    saveCurrentLayout,
    loadPreset
  } = useDashboard()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'layouts' | 'presets'>('layouts')
  const [layouts, setLayouts] = useState<Layout[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newLayoutName, setNewLayoutName] = useState('')
  const [newLayoutDescription, setNewLayoutDescription] = useState('')

  // Load layouts and presets
  useEffect(() => {
    if (isOpen) {
      loadLayouts()
      loadPresets()
    }
  }, [isOpen])

  const loadLayouts = async () => {
    try {
      const response = await fetch('/api/dashboard/layouts')
      if (response.ok) {
        const { layouts } = await response.json()
        setLayouts(layouts)
      }
    } catch (error) {
      console.error('Failed to load layouts:', error)
    }
  }

  const loadPresets = async () => {
    try {
      const response = await fetch('/api/dashboard/presets')
      if (response.ok) {
        const { presets } = await response.json()
        setPresets(presets)
      }
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  const handleSaveLayout = async () => {
    if (!newLayoutName.trim()) return

    try {
      await saveCurrentLayout(newLayoutName, newLayoutDescription)
      setSaveDialogOpen(false)
      setNewLayoutName('')
      setNewLayoutDescription('')
      loadLayouts()
    } catch (error) {
      console.error('Failed to save layout:', error)
    }
  }

  const handleApplyPreset = async (presetId: string) => {
    try {
      await loadPreset(presetId)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to apply preset:', error)
    }
  }

  const handleDeleteLayout = async (layoutId: string) => {
    if (!confirm('Are you sure you want to delete this layout?')) return

    try {
      const response = await fetch(`/api/dashboard/layouts/${layoutId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        loadLayouts()
      }
    } catch (error) {
      console.error('Failed to delete layout:', error)
    }
  }

  const filteredPresets = presets.filter(preset => {
    const matchesSearch = preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         preset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...Array.from(new Set(presets.map(p => p.category)))]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background/95 backdrop-blur-sm border-border/50"
        >
          <LayoutTemplate className="w-4 h-4" />
          Layouts
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            Dashboard Layouts & Presets
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('layouts')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'layouts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            My Layouts ({layouts.length})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'presets'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            Presets ({presets.length})
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === 'layouts' && (
            <div className="h-full flex flex-col">
              {/* Save Current Layout */}
              <div className="p-4 border-b bg-muted/50">
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Current Layout
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Layout</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Layout Name</label>
                        <Input
                          value={newLayoutName}
                          onChange={(e) => setNewLayoutName(e.target.value)}
                          placeholder="My Custom Layout"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description (Optional)</label>
                        <Textarea
                          value={newLayoutDescription}
                          onChange={(e) => setNewLayoutDescription(e.target.value)}
                          placeholder="Describe your layout..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setSaveDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveLayout}
                          disabled={!newLayoutName.trim() || loading}
                        >
                          Save Layout
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Layouts List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={cn(
                      'p-4 rounded-lg border transition-colors',
                      layout.isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{layout.name}</h3>
                          {layout.isActive && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                          {layout.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {layout.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {layout.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Updated {new Date(layout.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!layout.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Apply layout logic here
                              setIsOpen(false)
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLayout(layout.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {layouts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No saved layouts yet</p>
                    <p className="text-sm">Save your current layout to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="h-full flex flex-col">
              {/* Search and Filters */}
              <div className="p-4 border-b space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search presets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{preset.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {preset.description}
                          </p>
                        </div>
                        {preset.isPublic && (
                          <Users className="w-4 h-4 text-muted-foreground ml-2" />
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {preset.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {preset.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{preset.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>{preset.usageCount} uses</span>
                        {preset.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{preset.rating.toFixed(1)} ({preset.ratingCount})</span>
                          </div>
                        )}
                      </div>

                      {/* Creator */}
                      {preset.creator && (
                        <div className="flex items-center gap-2 mb-3">
                          {preset.creator.image && (
                            <img
                              src={preset.creator.image}
                              alt={preset.creator.name}
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-xs text-muted-foreground">
                            by {preset.creator.name}
                          </span>
                        </div>
                      )}

                      {/* Apply Button */}
                      <Button
                        onClick={() => handleApplyPreset(preset.id)}
                        className="w-full"
                        size="sm"
                        disabled={loading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Apply Preset
                      </Button>
                    </div>
                  ))}
                </div>

                {filteredPresets.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <LayoutTemplate className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No presets found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}