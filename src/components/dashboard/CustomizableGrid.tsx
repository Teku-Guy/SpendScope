'use client'

import React, { useMemo, useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { useDashboard } from '@/contexts/DashboardContext'
import { WidgetWrapper } from './WidgetWrapper'
import { getWidget } from '@/lib/widgets/registry'
import { LayoutItem } from '@/lib/widgets/types'
import { useSession } from 'next-auth/react'
import PlaidLink from '@/components/plaid/PlaidLink'
import { useMemo as useMemoReact, useCallback as useCallbackReact } from 'react'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface CustomizableGridProps {
  refreshKey?: number
}

export function CustomizableGrid({ refreshKey }: CustomizableGridProps) {
  const { data: session } = useSession()
  const {
    currentLayout,
    isEditMode,
    setLayout,
    addWidget,
    removeWidget,
    getWidgetConfig,
    setBreakpoint
  } = useDashboard()

  // Create PlaidLink component with success handler
  const handlePlaidSuccess = useCallbackReact(() => {
    // This will be handled by the parent component's refreshKey
  }, [])

  const plaidLinkComponent = useMemoReact(() => (
    <PlaidLink onSuccess={handlePlaidSuccess} />
  ), [handlePlaidSuccess])

  // Grid layout configuration
  const layouts = useMemo(() => ({
    lg: currentLayout,
    md: currentLayout,
    sm: currentLayout,
    xs: currentLayout,
    xxs: currentLayout
  }), [currentLayout])

  const breakpoints = {
    lg: 1200,   // Large laptops/desktops
    md: 768,    // Tablets
    sm: 640,    // Large phones/small tablets
    xs: 480,    // Phones landscape
    xxs: 0      // Phones portrait
  }

  const cols = {
    lg: 3,  // 3 columns on large screens
    md: 2,  // 2 columns on tablets
    sm: 1,  // 1 column on large phones (better for touch)
    xs: 1,  // 1 column on phones landscape
    xxs: 1  // 1 column on phones portrait
  }

  // Smart layout processing to expand single widgets
  const processSmartLayout = useCallback((layout: LayoutItem[]): LayoutItem[] => {
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
  }, [])

  // Handle layout changes
  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    if (!isEditMode) return

    // Convert Layout[] to LayoutItem[]
    const newLayout: LayoutItem[] = layout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      maxW: item.maxW,
      minH: item.minH,
      maxH: item.maxH,
      static: item.static,
      isDraggable: item.isDraggable,
      isResizable: item.isResizable
    }))

    // Store layout directly without smart processing during editing
    // Smart layout processing will be applied on save
    setLayout(newLayout)
  }, [isEditMode, setLayout])

  // Handle breakpoint changes
  const handleBreakpointChange = useCallback((newBreakpoint: string) => {
    setBreakpoint(newBreakpoint)
  }, [setBreakpoint])

  // Handle widget drop from library
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()

    if (!isEditMode) return

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))

      if (data.type === 'widget' && data.widget) {
        const widget = data.widget

        // Check if widget is already on dashboard
        if (currentLayout.some(item => item.i === widget.id)) {
          return
        }

        // Calculate drop position based on mouse coordinates
        const rect = e.currentTarget.getBoundingClientRect()
        const x = Math.floor((e.clientX - rect.left) / 100) // Approximate grid cell width
        const y = Math.floor((e.clientY - rect.top) / 60) // Row height

        addWidget(widget.id, {
          x: Math.max(0, Math.min(x, 11 - (widget.defaultSize?.w || 6))),
          y: Math.max(0, y)
        })
      }
    } catch (error) {
      console.error('Failed to handle widget drop:', error)
    }
  }, [isEditMode, currentLayout])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // Render individual widgets
  const renderWidget = useCallback((layoutItem: LayoutItem) => {
    const widget = getWidget(layoutItem.i)
    if (!widget) return null

    const config = getWidgetConfig(layoutItem.i)

    const handleConfigOpen = () => {
      // TODO: Open widget configuration modal
      console.log('Opening config for:', layoutItem.i)
    }

    const handleRemove = () => {
      removeWidget(layoutItem.i)
    }

    // Special props for specific widgets
    const getWidgetProps = () => {
      switch (layoutItem.i) {
        case 'welcome-banner':
          return { session, plaidLinkComponent }
        case 'spending-chart':
          return { period: config.period || '30d', chartType: config.chartType || 'area' }
        case 'category-breakdown':
          return { period: config.period || '30d', chartType: config.chartType || 'pie' }
        case 'transaction-list':
          return {
            limit: config.limit || 10,
            showFilters: config.showFilters !== false,
            enablePagination: config.enablePagination !== false
          }
        default:
          return {}
      }
    }

    const WidgetComponent = widget.component
    const widgetProps = getWidgetProps()

    return (
      <div key={layoutItem.i}>
        <WidgetWrapper
          widget={widget}
          config={config}
          isEditMode={isEditMode}
          onConfigOpen={widget.configurable ? handleConfigOpen : undefined}
          onRemove={handleRemove}
          refreshKey={refreshKey}
        >
          <WidgetComponent {...widgetProps} />
        </WidgetWrapper>
      </div>
    )
  }, [
    isEditMode,
    getWidgetConfig,
    removeWidget,
    session,
    plaidLinkComponent,
    refreshKey
  ])

  return (
    <div
      className="w-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={80}
        margin={[12, 12]}
        containerPadding={[8, 8]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        onBreakpointChange={handleBreakpointChange}
        draggableCancel=".non-draggable"
        draggableHandle=".widget-drag-handle"
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        autoSize={true}
      >
        {currentLayout.map(renderWidget)}
      </ResponsiveGridLayout>

      {/* Add CSS for react-grid-layout */}
      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }

        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, transform;
        }

        .react-grid-item img {
          pointer-events: none;
          user-select: none;
        }

        .react-grid-item.cssTransforms {
          transition-property: transform;
        }

        .react-grid-item.resizing {
          transition: none;
          z-index: 1;
          will-change: width, height;
        }

        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 3;
          will-change: transform;
        }

        .react-grid-item.dropping {
          visibility: hidden;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.1);
          opacity: 1;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 8px;
          border: 2px solid rgb(59 130 246);
        }

        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjNjY2IiBvcGFjaXR5PSIxIj4KPGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjEiLz4KPGNpcmNsZSBjeD0iNSIgY3k9IjEiIHI9IjEiLz4KPGNpcmNsZSBjeD0iMSIgY3k9IjUiIHI9IjEiLz4KPC9kb3RzPgo8L3N2Zz4K');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .react-resizable-handle:hover {
          opacity: 1;
        }

        .react-grid-item:hover .react-resizable-handle {
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}