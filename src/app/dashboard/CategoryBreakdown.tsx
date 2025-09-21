'use client'

import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'

interface CategoryData {
  category: string
  amount: number
  count: number
  percentage: number
  color: string
  [key: string]: string | number
}

interface CategoryBreakdownProps {
  period?: string
  chartType?: 'pie' | 'bar'
}

export default function CategoryBreakdown({
  period = '30d',
  chartType = 'pie'
}: CategoryBreakdownProps) {
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [selectedChart, setSelectedChart] = useState(chartType)
  const { actualTheme } = useTheme()

  // Get theme-aware colors
  const getThemeColors = () => {
    const isDark = actualTheme === 'dark'
    return {
      text: isDark ? '#f9fafb' : '#111827',
      textMuted: isDark ? '#9ca3af' : '#6b7280',
      border: isDark ? '#374151' : '#e5e7eb',
      background: isDark ? '#1f2937' : '#ffffff',
      gridLines: isDark ? '#374151' : '#f3f4f6'
    }
  }

  const themeColors = getThemeColors()

  // Category colors for consistent theming - memoized to prevent useEffect dependency issues
  const categoryColors = useMemo(() => ({
    'Food & Dining': '#ef4444',
    'Shopping': '#f97316',
    'Transportation': '#eab308',
    'Bills & Utilities': '#22c55e',
    'Entertainment': '#8b5cf6',
    'Healthcare': '#06b6d4',
    'Travel': '#ec4899',
    'Education': '#10b981',
    'Personal Care': '#f59e0b',
    'Other': '#6b7280'
  }), [])

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const response = await fetch(`/api/analytics/category-breakdown?period=${selectedPeriod}`)
        const result = await response.json()

        if (result.success) {
          // Add colors to the data
          const dataWithColors = result.data.map((item: Omit<CategoryData, 'color'>) => ({
            ...item,
            color: categoryColors[item.category as keyof typeof categoryColors] || categoryColors['Other']
          }))
          setData(dataWithColors)
        }
      } catch (error) {
        console.error('Error fetching category data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [selectedPeriod, categoryColors])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const totalSpent = data.reduce((sum, item) => sum + item.amount, 0)

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={2}
          dataKey="amount"
        >
          {data.map((entry) => (
            <Cell key={`cell-${entry.category}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Spent']}
          contentStyle={{
            backgroundColor: themeColors.background,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '8px',
            color: themeColors.text,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
          labelStyle={{ color: themeColors.text }}
        />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 85, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={themeColors.gridLines} />
        <XAxis
          type="number"
          tickFormatter={formatCurrency}
          stroke={themeColors.textMuted}
          fontSize={12}
          tick={{ fill: themeColors.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="category"
          stroke={themeColors.textMuted}
          fontSize={11}
          width={80}
          tick={{ fill: themeColors.textMuted, fontSize: 11 }}
          interval={0}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Spent']}
          contentStyle={{
            backgroundColor: themeColors.background,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '8px',
            color: themeColors.text,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
          labelStyle={{ color: themeColors.text }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={`cell-${entry.category}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

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

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Spending by Category</h3>
            <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalSpent)}</p>
          </div>

          <div className="chart-controls mt-4 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
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
              onChange={(e) => setSelectedChart(e.target.value as 'pie' | 'bar')}
              className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="pie">Pie Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Chart */}
          <div className="min-h-0">
            <div className={`chart-container h-full min-h-[250px]`}>
              {selectedChart === 'pie' ? renderPieChart() : renderBarChart()}
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3 overflow-auto">
            {data.map((category) => (
              <div key={category.category} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {category.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {category.count} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}

            {data.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No spending data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}