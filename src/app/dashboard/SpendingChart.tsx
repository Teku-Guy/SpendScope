'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface SpendingData {
  date: string
  amount: number
  income: number
  netFlow: number
}

interface SpendingChartProps {
  period?: '7d' | '30d' | '90d' | '1y'
  chartType?: 'line' | 'area' | 'bar'
}

export default function SpendingChart({
  period = '30d',
  chartType = 'area'
}: SpendingChartProps) {
  const [data, setData] = useState<SpendingData[]>([])
  const [loading, setLoading] = useState(true)
  // Sanitize and validate user inputs to prevent XSS
  const isValidPeriod = (value: string): value is '7d' | '30d' | '90d' | '1y' => {
    return ['7d', '30d', '90d', '1y'].includes(value)
  }

  const isValidChartType = (value: string): value is 'line' | 'area' | 'bar' => {
    return ['line', 'area', 'bar'].includes(value)
  }

  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>(
    isValidPeriod(period) ? period : '30d'
  )
  const [selectedChart, setSelectedChart] = useState<'line' | 'area' | 'bar'>(
    isValidChartType(chartType) ? chartType : 'area'
  )
  const { actualTheme } = useTheme()

  // Sanitize color values to prevent XSS
  const sanitizeColor = (color: string): string => {
    // Only allow valid hex colors, rgb/rgba colors, and named colors
    const validColorPattern = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-zA-Z]+)$/
    return validColorPattern.test(color) ? color : '#000000'
  }

  // Get theme-aware colors with sanitization
  const getThemeColors = () => {
    const isDark = actualTheme === 'dark'

    const rawColors = {
      primary: isDark ? '#ef4444' : '#dc2626',      // red-500 : red-600
      primaryLight: isDark ? '#fca5a5' : '#fecaca', // red-300 : red-200
      primaryFill: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 202, 202, 0.3)',
      text: isDark ? '#f9fafb' : '#111827',         // gray-50 : gray-900
      textMuted: isDark ? '#9ca3af' : '#6b7280',    // gray-400 : gray-500
      border: isDark ? '#374151' : '#e5e7eb',       // gray-700 : gray-200
      background: isDark ? '#1f2937' : '#ffffff',   // gray-800 : white
      gridLines: isDark ? '#374151' : '#f3f4f6',    // gray-700 : gray-100
      positive: isDark ? '#10b981' : '#059669',     // emerald-500 : emerald-600
      negative: isDark ? '#ef4444' : '#dc2626'      // red-500 : red-600
    }

    // Sanitize all color values
    return Object.fromEntries(
      Object.entries(rawColors).map(([key, value]) => [key, sanitizeColor(value)])
    ) as typeof rawColors
  }

  const colors = getThemeColors()

  useEffect(() => {
    const fetchSpendingData = async () => {
      try {
        const response = await fetch(`/api/analytics/spending-trends?period=${selectedPeriod}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Error fetching spending data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpendingData()
  }, [selectedPeriod])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (selectedPeriod === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else if (selectedPeriod === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  const calculateTrend = () => {
    if (data.length < 2) return { percentage: 0, isPositive: true }

    const recent = data.slice(-7).reduce((sum, item) => sum + item.amount, 0) / 7
    const previous = data.slice(-14, -7).reduce((sum, item) => sum + item.amount, 0) / 7

    if (previous === 0) return { percentage: 0, isPositive: true }

    const percentage = ((recent - previous) / previous) * 100
    return { percentage: Math.abs(percentage), isPositive: percentage < 0 } // Less spending is positive
  }

  const trend = calculateTrend()
  const totalSpent = data.reduce((sum, item) => sum + item.amount, 0)
  const averageDaily = data.length > 0 ? totalSpent / data.length : 0

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse h-full bg-muted rounded" />
        </div>
      </div>
    )
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }

    const commonElements = [
      <CartesianGrid key="grid" strokeDasharray="3 3" stroke={colors.gridLines} />,
      <XAxis
        key="xaxis"
        dataKey="date"
        tickFormatter={formatDate}
        stroke={colors.textMuted}
        fontSize={12}
        tick={{ fill: colors.textMuted }}
      />,
      <YAxis
        key="yaxis"
        tickFormatter={formatCurrency}
        stroke={colors.textMuted}
        fontSize={12}
        tick={{ fill: colors.textMuted }}
      />,
      <Tooltip
        key="tooltip"
        formatter={(value: number) => [formatCurrency(value), 'Spent']}
        labelFormatter={(label) => `Date: ${formatDate(label)}`}
        contentStyle={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          color: colors.text,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        labelStyle={{ color: colors.text }}
      />
    ]

    switch (selectedChart) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {commonElements}
            <Line
              type="monotone"
              dataKey="amount"
              stroke={colors.primary}
              strokeWidth={2}
              dot={{ fill: colors.primary, strokeWidth: 2, r: 4, stroke: colors.background }}
              activeDot={{
                r: 6,
                stroke: colors.primary,
                strokeWidth: 2,
                fill: colors.background
              }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonElements}
            <Bar
              dataKey="amount"
              fill={colors.primary}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        )

      default: // area
        return (
          <AreaChart {...commonProps}>
            {commonElements}
            <Area
              type="monotone"
              dataKey="amount"
              stroke={colors.primary}
              fill={colors.primaryFill}
              strokeWidth={2}
            />
          </AreaChart>
        )
    }
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Spending Trends</h3>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Total: {formatCurrency(totalSpent)}</span>
              <span>Daily Avg: {formatCurrency(averageDaily)}</span>
              <div className={`flex items-center space-x-1 ${
                trend.isPositive ? 'text-emerald-600' : 'text-destructive'
              }`}>
                {trend.isPositive ? (
                  <TrendingDownIcon className="h-4 w-4" />
                ) : (
                  <TrendingUpIcon className="h-4 w-4" />
                )}
                <span>{trend.percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => {
                const value = e.target.value
                if (isValidPeriod(value)) {
                  setSelectedPeriod(value)
                }
              }}
              className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>

            {/* Chart Type Selector */}
            <select
              value={selectedChart}
              onChange={(e) => {
                const value = e.target.value
                if (isValidChartType(value)) {
                  setSelectedChart(value)
                }
              }}
              className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="area">Area Chart</option>
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}