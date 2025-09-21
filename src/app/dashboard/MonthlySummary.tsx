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
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={`loading-summary-${i}`} className="h-24 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Monthly Summary</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
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
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      isNegativeBetter: true
    },
    {
      title: 'Total Income',
      value: formatCurrency(data.currentMonth.income),
      change: data.trends.incomeChange,
      icon: DollarSignIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      isNegativeBetter: false
    },
    {
      title: 'Net Flow',
      value: formatCurrency(data.currentMonth.netFlow),
      change: netFlowChange,
      icon: data.currentMonth.netFlow >= 0 ? TrendingUpIcon : TrendingDownIcon,
      color: data.currentMonth.netFlow >= 0 ? 'text-emerald-600' : 'text-destructive',
      bgColor: data.currentMonth.netFlow >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10',
      isNegativeBetter: false
    },
    {
      title: 'Transactions',
      value: data.currentMonth.transactions.toString(),
      change: data.trends.transactionChange,
      icon: CreditCardIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      isNegativeBetter: false
    }
  ]

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Monthly Summary</h2>
          <p className="text-sm text-muted-foreground">{getCurrentMonthName()}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="summary-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {summaryCards.map((card) => {
            const IconComponent = card.icon
            const isPositiveTrend = card.isNegativeBetter ? card.change < 0 : card.change > 0
            const TrendIcon = isPositiveTrend ? TrendingUpIcon : TrendingDownIcon

            return (
              <div key={card.title} className="summary-card bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-all duration-200">
                <div className="flex items-center">
                  <div className={`icon-container flex-shrink-0 p-2 rounded-full ${card.bgColor} border border-border/30`}>
                    <IconComponent className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        {card.title}
                      </dt>
                      <dd className="text-lg font-semibold text-foreground">
                        {card.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center text-sm">
                    <TrendIcon
                      className={`h-4 w-4 mr-1 ${
                        isPositiveTrend ? 'text-emerald-500' : 'text-destructive'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isPositiveTrend ? 'text-emerald-600' : 'text-destructive'
                      }`}
                    >
                      {formatPercentage(Math.abs(card.change))}
                    </span>
                    <span className="text-muted-foreground ml-1">from last month</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Insights */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">💡</span>
            Quick Insights
          </h3>
          <div className="space-y-1 text-sm text-foreground/80">
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
    </div>
  )
}