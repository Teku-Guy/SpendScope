'use client'

import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

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
    <ResponsiveContainer width="100%" height={300}>
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
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Spent']}
        />
      </PieChart>
    </ResponsiveContainer>
  )

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          type="number"
          tickFormatter={formatCurrency}
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="category"
          stroke="#6b7280"
          fontSize={12}
          width={100}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), 'Spent']}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Spending by Category</h3>
          <p className="text-sm text-gray-500">Total: {formatCurrency(totalSpent)}</p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="h-64">
          {selectedChart === 'pie' ? renderPieChart() : renderBarChart()}
        </div>

        {/* Category List */}
        <div className="space-y-3">
          {data.map((category) => (
            <div key={category.category} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {category.category}
                  </p>
                  <p className="text-xs text-gray-500">
                    {category.count} transactions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(category.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {category.percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}

          {data.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No spending data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}