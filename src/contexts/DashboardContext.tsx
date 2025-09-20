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
  saveCurrentLayout: (name: string) => Promise<void>
  deletePreset: (presetId: string) => Promise<void>

  // Persistence
  saveLayout: () => Promise<void>
  loadLayout: () => Promise<void>

  // Utilities
  setError: (error: string | null) => void
  setBreakpoint: (breakpoint: string) => void
}

// Default layout configuration
const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: 'welcome-banner', x: 0, y: 0, w: 12, h: 3 },
  { i: 'bank-accounts', x: 0, y: 3, w: 12, h: 4 },
  { i: 'monthly-summary', x: 0, y: 7, w: 12, h: 4 },
  { i: 'budget-overview', x: 0, y: 11, w: 12, h: 6 },
  { i: 'spending-insights', x: 0, y: 17, w: 12, h: 5 },
  { i: 'spending-chart', x: 0, y: 22, w: 6, h: 5 },
  { i: 'category-breakdown', x: 6, y: 22, w: 6, h: 5 },
  { i: 'transaction-list', x: 0, y: 27, w: 12, h: 6 }
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
        w: 6,
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

  // API functions (to be implemented)
  const loadPreset = useCallback(async (presetId: string) => {
    // TODO: Implement preset loading
    console.log('Loading preset:', presetId)
  }, [])

  const saveCurrentLayout = useCallback(async (name: string) => {
    // TODO: Implement layout saving
    console.log('Saving layout:', name)
  }, [])

  const deletePreset = useCallback(async (presetId: string) => {
    // TODO: Implement preset deletion
    console.log('Deleting preset:', presetId)
  }, [])

  const saveLayout = useCallback(async () => {
    // TODO: Implement layout persistence
    console.log('Saving current layout')
  }, [])

  const loadLayout = useCallback(async () => {
    // TODO: Implement layout loading
    console.log('Loading layout')
  }, [])

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