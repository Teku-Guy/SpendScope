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
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>(period)
  const [selectedChart, setSelectedChart] = useState<'line' | 'area' | 'bar'>(chartType)

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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 rounded" />
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
      <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" />,
      <XAxis
        key="xaxis"
        dataKey="date"
        tickFormatter={formatDate}
        stroke="#6b7280"
        fontSize={12}
      />,
      <YAxis
        key="yaxis"
        tickFormatter={formatCurrency}
        stroke="#6b7280"
        fontSize={12}
      />,
      <Tooltip
        key="tooltip"
        formatter={(value: number) => [formatCurrency(value), 'Spent']}
        labelFormatter={(label) => `Date: ${formatDate(label)}`}
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
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {commonElements}
            <Bar dataKey="amount" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        )

      default: // area
        return (
          <AreaChart {...commonProps}>
            {commonElements}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#ef4444"
              fill="#fecaca"
              strokeWidth={2}
            />
          </AreaChart>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Spending Trends</h3>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <span>Total: {formatCurrency(totalSpent)}</span>
            <span>Daily Avg: {formatCurrency(averageDaily)}</span>
            <div className={`flex items-center space-x-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
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

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d' | '1y')}
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
            onChange={(e) => setSelectedChart(e.target.value as 'line' | 'area' | 'bar')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="area">Area Chart</option>
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  )
}