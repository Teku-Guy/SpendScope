'use client'

import { useState, useEffect } from 'react'
import { TrendingUpIcon, TrendingDownIcon, CreditCardIcon, DollarSignIcon } from 'lucide-react'

interface MonthlyData {
  spending: number
  income: number
  transactions: number
  netFlow: number
}

interface TrendData {
  spendingChange: number
  incomeChange: number
  transactionChange: number
}

interface MonthlySummaryData {
  currentMonth: MonthlyData
  previousMonth: MonthlyData
  trends: TrendData
}

interface SummaryCard {
  title: string
  value: string
  change: number
  icon: React.ElementType
  color: string
  bgColor: string
  isNegativeBetter: boolean
}

export default function MonthlySummary() {
  const [data, setData] = useState<MonthlySummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        const response = await fetch('/api/analytics/monthly-summary')
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Error fetching monthly summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlySummary()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  // Calculate net flow change
  const netFlowChange = data.previousMonth.netFlow !== 0
    ? ((data.currentMonth.netFlow - data.previousMonth.netFlow) / Math.abs(data.previousMonth.netFlow)) * 100
    : 0

  const summaryCards: SummaryCard[] = [
    {
      title: 'Total Spending',
      value: formatCurrency(data.currentMonth.spending),
      change: data.trends.spendingChange,
      icon: CreditCardIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      isNegativeBetter: true
    },
    {
      title: 'Total Income',
      value: formatCurrency(data.currentMonth.income),
      change: data.trends.incomeChange,
      icon: DollarSignIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isNegativeBetter: false
    },
    {
      title: 'Net Flow',
      value: formatCurrency(data.currentMonth.netFlow),
      change: netFlowChange,
      icon: data.currentMonth.netFlow >= 0 ? TrendingUpIcon : TrendingDownIcon,
      color: data.currentMonth.netFlow >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: data.currentMonth.netFlow >= 0 ? 'bg-green-50' : 'bg-red-50',
      isNegativeBetter: false
    },
    {
      title: 'Transactions',
      value: data.currentMonth.transactions.toString(),
      change: data.trends.transactionChange,
      icon: CreditCardIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      isNegativeBetter: false
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Monthly Summary</h2>
        <p className="text-sm text-gray-500">{getCurrentMonthName()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const IconComponent = card.icon
          const isPositiveTrend = card.isNegativeBetter ? card.change < 0 : card.change > 0
          const TrendIcon = isPositiveTrend ? TrendingUpIcon : TrendingDownIcon

          return (
            <div key={card.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-full ${card.bgColor}`}>
                  <IconComponent className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <TrendIcon
                    className={`h-4 w-4 mr-1 ${
                      isPositiveTrend ? 'text-green-500' : 'text-red-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isPositiveTrend ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercentage(Math.abs(card.change))}
                  </span>
                  <span className="text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Insights */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Quick Insights</h3>
        <div className="space-y-1 text-sm text-blue-800">
          {data.currentMonth.netFlow > 0 && (
            <p>✓ You&apos;re saving {formatCurrency(data.currentMonth.netFlow)} this month</p>
          )}
          {data.trends.spendingChange < -5 && (
            <p>✓ Your spending decreased by {Math.abs(data.trends.spendingChange).toFixed(1)}%</p>
          )}
          {data.trends.spendingChange > 10 && (
            <p>⚠ Your spending increased by {data.trends.spendingChange.toFixed(1)}%</p>
          )}
          {data.currentMonth.netFlow < 0 && (
            <p>⚠ You&apos;re spending {formatCurrency(Math.abs(data.currentMonth.netFlow))} more than your income</p>
          )}
        </div>
      </div>
    </div>
  )
}