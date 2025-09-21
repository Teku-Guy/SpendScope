'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { DashboardLayout, LayoutItem, WidgetConfig, DashboardPreset } from '@/lib/widgets/types'

// Action types
type DashboardAction =
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_LAYOUT'; payload: LayoutItem[] }
  | { type: 'UPDATE_LAYOUT_ITEM'; payload: { id: string; updates: Partial<LayoutItem> } }
  | { type: 'ADD_WIDGET'; payload: { widgetId: string; position?: { x: number; y: number } } }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'SET_WIDGET_CONFIG'; payload: { widgetId: string; config: WidgetConfig } }
  | { type: 'SET_CURRENT_PRESET'; payload: string }
  | { type: 'SET_PRESETS'; payload: DashboardPreset[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BREAKPOINT'; payload: string }
  | { type: 'RESET_LAYOUT' }

// State interface
interface DashboardState {
  isEditMode: boolean
  currentLayout: LayoutItem[]
  widgetConfigs: Record<string, WidgetConfig>
  currentPreset: string
  presets: DashboardPreset[]
  loading: boolean
  error: string | null
  breakpoint: string
  isDirty: boolean // Has unsaved changes
}

// Context interface
interface DashboardContextType extends DashboardState {
  // Layout actions
  setEditMode: (enabled: boolean) => void
  setLayout: (layout: LayoutItem[]) => void
  updateLayoutItem: (id: string, updates: Partial<LayoutItem>) => void
  addWidget: (widgetId: string, position?: { x: number; y: number }) => void
  removeWidget: (widgetId: string) => void
  resetLayout: () => void

  // Widget configuration
  setWidgetConfig: (widgetId: string, config: WidgetConfig) => void
  getWidgetConfig: (widgetId: string) => WidgetConfig

  // Preset management
  setCurrentPreset: (presetId: string) => void
  loadPreset: (presetId: string) => void
  saveCurrentLayout: (name: string, description?: string) => Promise<void>
  deletePreset: (presetId: string) => Promise<void>

  // Persistence
  saveLayout: () => Promise<void>
  loadLayout: () => Promise<void>

  // Utilities
  setError: (error: string | null) => void
  setBreakpoint: (breakpoint: string) => void
}

// Smart layout processing function
const processSmartLayout = (layout: LayoutItem[]): LayoutItem[] => {
  if (!layout || layout.length === 0) return []

  // Group widgets by row (y coordinate)
  const rowGroups: { [key: number]: LayoutItem[] } = {}
  layout.forEach(item => {
    const rowKey = item.y
    if (!rowGroups[rowKey]) rowGroups[rowKey] = []
    rowGroups[rowKey].push(item)
  })

  // Process each row
  const processedLayout: LayoutItem[] = []
  Object.keys(rowGroups).forEach(rowKey => {
    const rowItems = rowGroups[parseInt(rowKey)]

    if (rowItems.length === 1) {
      // Single widget on this row - expand it to full width
      const item = rowItems[0]
      processedLayout.push({
        ...item,
        x: 0,
        w: 3 // Full width for 3-column grid
      })
    } else {
      // Multiple widgets - keep their current sizing
      processedLayout.push(...rowItems)
    }
  })

  return processedLayout
}

// Default layout configuration
const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'welcome-banner', x: 0, y: 0, w: 3, h: 3 },
  { i: 'bank-accounts', x: 0, y: 3, w: 3, h: 4 },
  { i: 'monthly-summary', x: 1, y: 3, w: 2, h: 4 },
  { i: 'budget-overview', x: 0, y: 7, w: 3, h: 6 },
  { i: 'spending-insights', x: 0, y: 13, w: 3, h: 5 },
  { i: 'spending-chart', x: 0, y: 18, w: 1, h: 5 },
  { i: 'category-breakdown', x: 1, y: 18, w: 2, h: 5 },
  { i: 'transaction-list', x: 0, y: 23, w: 3, h: 6 }
]

// Initial state
const initialState: DashboardState = {
  isEditMode: false,
  currentLayout: DEFAULT_LAYOUT,
  widgetConfigs: {},
  currentPreset: 'default',
  presets: [],
  loading: false,
  error: null,
  breakpoint: 'lg',
  isDirty: false
}

// Reducer function
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_EDIT_MODE':
      return { ...state, isEditMode: action.payload }

    case 'SET_LAYOUT':
      return {
        ...state,
        currentLayout: action.payload,
        isDirty: true
      }

    case 'UPDATE_LAYOUT_ITEM':
      return {
        ...state,
        currentLayout: state.currentLayout.map(item =>
          item.i === action.payload.id
            ? { ...item, ...action.payload.updates }
            : item
        ),
        isDirty: true
      }

    case 'ADD_WIDGET':
      const newItem: LayoutItem = {
        i: action.payload.widgetId,
        x: action.payload.position?.x || 0,
        y: action.payload.position?.y || Infinity, // Place at bottom
        w: 1, // Default to 1 column width (will expand to full width if alone)
        h: 4
      }
      return {
        ...state,
        currentLayout: [...state.currentLayout, newItem],
        isDirty: true
      }

    case 'REMOVE_WIDGET':
      return {
        ...state,
        currentLayout: state.currentLayout.filter(item => item.i !== action.payload),
        isDirty: true
      }

    case 'SET_WIDGET_CONFIG':
      return {
        ...state,
        widgetConfigs: {
          ...state.widgetConfigs,
          [action.payload.widgetId]: action.payload.config
        },
        isDirty: true
      }

    case 'SET_CURRENT_PRESET':
      return { ...state, currentPreset: action.payload }

    case 'SET_PRESETS':
      return { ...state, presets: action.payload }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_BREAKPOINT':
      return { ...state, breakpoint: action.payload }

    case 'RESET_LAYOUT':
      return {
        ...state,
        currentLayout: DEFAULT_LAYOUT,
        widgetConfigs: {},
        isDirty: false
      }

    default:
      return state
  }
}

// Create context
const DashboardContext = createContext<DashboardContextType | null>(null)

// Provider component
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  // Actions
  const setEditMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: enabled })
  }, [])

  const setLayout = useCallback((layout: LayoutItem[]) => {
    dispatch({ type: 'SET_LAYOUT', payload: layout })
  }, [])

  const updateLayoutItem = useCallback((id: string, updates: Partial<LayoutItem>) => {
    dispatch({ type: 'UPDATE_LAYOUT_ITEM', payload: { id, updates } })
  }, [])

  const addWidget = useCallback((widgetId: string, position?: { x: number; y: number }) => {
    dispatch({ type: 'ADD_WIDGET', payload: { widgetId, position } })
  }, [])

  const removeWidget = useCallback((widgetId: string) => {
    dispatch({ type: 'REMOVE_WIDGET', payload: widgetId })
  }, [])

  const resetLayout = useCallback(() => {
    dispatch({ type: 'RESET_LAYOUT' })
  }, [])

  const setWidgetConfig = useCallback((widgetId: string, config: WidgetConfig) => {
    dispatch({ type: 'SET_WIDGET_CONFIG', payload: { widgetId, config } })
  }, [])

  const getWidgetConfig = useCallback((widgetId: string): WidgetConfig => {
    return state.widgetConfigs[widgetId] || {}
  }, [state.widgetConfigs])

  const setCurrentPreset = useCallback((presetId: string) => {
    dispatch({ type: 'SET_CURRENT_PRESET', payload: presetId })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }, [])

  const setBreakpoint = useCallback((breakpoint: string) => {
    dispatch({ type: 'SET_BREAKPOINT', payload: breakpoint })
  }, [])

  // API functions
  const loadPreset = useCallback(async (presetId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await fetch(`/api/dashboard/presets/${presetId}`)
      if (!response.ok) {
        throw new Error('Failed to load preset')
      }

      const { preset } = await response.json()

      // Apply preset layout temporarily
      dispatch({ type: 'SET_LAYOUT', payload: preset.layoutData })

      // Apply widget configurations
      const configs = preset.widgetConfigs || {}
      Object.entries(configs).forEach(([widgetId, config]) => {
        dispatch({
          type: 'SET_WIDGET_CONFIG',
          payload: { widgetId, config: config as WidgetConfig }
        })
      })

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load preset' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const saveCurrentLayout = useCallback(async (name: string, description?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          layoutData: state.currentLayout,
          widgetConfigs: state.widgetConfigs,
          setAsActive: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save layout')
      }

      const { layout } = await response.json()

      // Mark as not dirty since we just saved
      dispatch({ type: 'SET_LAYOUT', payload: state.currentLayout })
      return layout

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save layout' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.currentLayout, state.widgetConfigs])

  const deletePreset = useCallback(async (presetId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await fetch(`/api/dashboard/presets/${presetId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete preset')
      }

      // Refresh presets list
      const presetsResponse = await fetch('/api/dashboard/presets')
      if (presetsResponse.ok) {
        const { presets } = await presetsResponse.json()
        dispatch({ type: 'SET_PRESETS', payload: presets })
      }

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete preset' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const saveLayout = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      // Apply smart layout processing before saving
      const processedLayout = processSmartLayout(state.currentLayout)

      // Get current active layout
      const layoutsResponse = await fetch('/api/dashboard/layouts')
      const { layouts } = await layoutsResponse.json()
      const activeLayout = layouts.find((l: { isActive: boolean; id: string }) => l.isActive)

      if (activeLayout) {
        // Update existing active layout
        const response = await fetch(`/api/dashboard/layouts/${activeLayout.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            layoutData: processedLayout,
            widgetConfigs: state.widgetConfigs
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save layout')
        }
      } else {
        // Create new default layout
        const response = await fetch('/api/dashboard/layouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'My Dashboard',
            layoutData: processedLayout,
            widgetConfigs: state.widgetConfigs,
            isDefault: true,
            setAsActive: true
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create layout')
        }
      }

      // Mark as saved (not dirty)
      dispatch({ type: 'SET_LAYOUT', payload: state.currentLayout })

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save layout' })
      throw error
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.currentLayout, state.widgetConfigs])

  const loadLayout = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const response = await fetch('/api/dashboard/layouts')
      if (!response.ok) {
        throw new Error('Failed to load layouts')
      }

      const { layouts } = await response.json()
      const activeLayout = layouts.find((l: { isActive: boolean; layoutData: unknown; widgetConfigs: unknown }) => l.isActive) || layouts[0]

      if (activeLayout) {
        dispatch({ type: 'SET_LAYOUT', payload: activeLayout.layoutData })

        // Load widget configurations
        const configs = activeLayout.widgetConfigs || {}
        Object.entries(configs).forEach(([widgetId, config]) => {
          dispatch({
            type: 'SET_WIDGET_CONFIG',
            payload: { widgetId, config: config as WidgetConfig }
          })
        })
      }

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load layout' })
      console.error('Layout loading failed, using default:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Load layout on mount
  useEffect(() => {
    loadLayout()
  }, [loadLayout])

  const contextValue: DashboardContextType = {
    ...state,
    setEditMode,
    setLayout,
    updateLayoutItem,
    addWidget,
    removeWidget,
    resetLayout,
    setWidgetConfig,
    getWidgetConfig,
    setCurrentPreset,
    loadPreset,
    saveCurrentLayout,
    deletePreset,
    saveLayout,
    loadLayout,
    setError,
    setBreakpoint
  }

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

// Custom hook
export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}