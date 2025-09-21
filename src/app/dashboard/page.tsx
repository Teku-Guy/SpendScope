'use client'

import { useState, useCallback } from 'react'
import { DashboardProvider } from '@/contexts/DashboardContext'
import { CustomizableGrid } from '@/components/dashboard/CustomizableGrid'
import { CustomizationToggle } from '@/components/dashboard/CustomizationToggle'

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePlaidSuccess = useCallback(() => {
    // Refresh all components when a new account is connected
    setRefreshKey(prev => prev + 1)
  }, [])

  return (
    <DashboardProvider>
      <div className="relative">
        {/* Customizable Grid */}
        <CustomizableGrid refreshKey={refreshKey} />

        {/* Floating Customization Toggle */}
        <CustomizationToggle />
      </div>
    </DashboardProvider>
  )
}