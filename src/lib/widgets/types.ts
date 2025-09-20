import { ComponentType } from 'react'

export interface WidgetSize {
  w: number
  h: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
}

export interface WidgetConfig {
  [key: string]: any
}

export interface Widget {
  id: string
  name: string
  description: string
  component: ComponentType<any>
  defaultSize: WidgetSize
  configurable: boolean
  category: 'overview' | 'analytics' | 'budget' | 'transactions' | 'accounts'
  icon: string // Lucide icon name
  disabled?: boolean
}

export interface LayoutItem {
  i: string // widget id
  x: number
  y: number
  w: number
  h: number
  minW?: number
  maxW?: number
  minH?: number
  maxH?: number
  static?: boolean
  isDraggable?: boolean
  isResizable?: boolean
}

export interface DashboardLayout {
  id: string
  name: string
  isDefault: boolean
  layout: LayoutItem[]
  breakpoint: string
  cols: number
}

export interface DashboardPreset {
  id: string
  name: string
  description: string
  layouts: {
    [breakpoint: string]: LayoutItem[]
  }
  widgets: string[] // widget ids included in this preset
  category: 'default' | 'user'
}

export type WidgetCategory = Widget['category']