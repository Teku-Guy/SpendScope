'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUpIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  InfoIcon,
  CheckCircleIcon
} from 'lucide-react'

interface SpendingInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category?: string
  amount?: number
  percentage?: number
  recommendation?: string
}

interface InsightsSummary {
  total: number
  highImpact: number
  warnings: number
  opportunities: number
}

interface SpendingInsightsData {
  insights: SpendingInsight[]
  summary: InsightsSummary
}

export default function SpendingInsights() {
  const [data, setData] = useState<SpendingInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('/api/analytics/spending-insights')
        const result = await response.json()

        if (result.success) {
          setData(result)
        }
      } catch (error) {
        console.error('Error fetching spending insights:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  const getInsightIcon = (type: string, impact: string) => {
    let colorClass = 'text-primary'
    if (impact === 'high') {
      colorClass = 'text-destructive'
    } else if (impact === 'medium') {
      colorClass = 'text-amber-500'
    }
    const iconClasses = `h-5 w-5 ${colorClass}`

    switch (type) {
      case 'warning':
        return <AlertTriangleIcon className={iconClasses} />
      case 'opportunity':
        return <LightbulbIcon className={iconClasses} />
      case 'trend':
        return <TrendingUpIcon className={iconClasses} />
      case 'anomaly':
        return <InfoIcon className={iconClasses} />
      default:
        return <CheckCircleIcon className={iconClasses} />
    }
  }

  const getInsightBorderColor = (type: string, impact: string) => {
    if (impact === 'high') {
      return type === 'warning' || type === 'anomaly' ? 'border-l-destructive' : 'border-l-amber-500'
    } else if (impact === 'medium') {
      return 'border-l-amber-500'
    }
    return 'border-l-primary'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={`loading-${i}`} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Spending Insights</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <CheckCircleIcon className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Great! No significant insights to report.</p>
            <p className="text-sm text-muted-foreground/80 mt-2">Your spending patterns look healthy.</p>
          </div>
        </div>
      </div>
    )
  }

  const displayedInsights = showAll ? data.insights : data.insights.slice(0, 5)

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Spending Insights</h3>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {data.summary.warnings > 0 && (
              <span className="flex items-center">
                <AlertTriangleIcon className="h-4 w-4 text-destructive mr-1" />
                {data.summary.warnings} warnings
              </span>
            )}
            {data.summary.opportunities > 0 && (
              <span className="flex items-center">
                <LightbulbIcon className="h-4 w-4 text-primary mr-1" />
                {data.summary.opportunities} opportunities
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-3">
          {displayedInsights.map((insight) => (
            <div
              key={insight.title + '-' + insight.type}
              className={`p-3 border-l-4 rounded-r-lg bg-accent/20 ${getInsightBorderColor(insight.type, insight.impact)} hover:bg-accent/30 transition-colors duration-200`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type, insight.impact)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {insight.title}
                    </h4>
                    {insight.amount && (
                      <span className="text-sm font-semibold text-foreground ml-2 flex-shrink-0">
                        {formatCurrency(insight.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/40 p-2 rounded border border-border/30">
                      💡 {insight.recommendation}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {insight.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {insight.category}
                      </span>
                    )}
                    {insight.percentage && (
                      <span className={`text-xs font-medium ${
                        insight.percentage > 0 ? 'text-destructive' : 'text-emerald-600'
                      }`}>
                        {insight.percentage > 0 ? '+' : ''}{insight.percentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.insights.length > 5 && (
          <div className="mt-4 text-center flex-shrink-0">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
            >
              {showAll ? 'Show Less' : `Show All ${data.insights.length} Insights`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}