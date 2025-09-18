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
    const iconClasses = `h-5 w-5 ${
      impact === 'high' ? 'text-red-500' :
      impact === 'medium' ? 'text-yellow-500' : 'text-blue-500'
    }`

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
      return type === 'warning' || type === 'anomaly' ? 'border-l-red-500' : 'border-l-orange-500'
    } else if (impact === 'medium') {
      return 'border-l-yellow-500'
    }
    return 'border-l-blue-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Insights</h3>
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-gray-500">Great! No significant insights to report.</p>
          <p className="text-sm text-gray-400 mt-2">Your spending patterns look healthy.</p>
        </div>
      </div>
    )
  }

  const displayedInsights = showAll ? data.insights : data.insights.slice(0, 5)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Spending Insights</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {data.summary.warnings > 0 && (
              <span className="flex items-center">
                <AlertTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                {data.summary.warnings} warnings
              </span>
            )}
            {data.summary.opportunities > 0 && (
              <span className="flex items-center">
                <LightbulbIcon className="h-4 w-4 text-blue-500 mr-1" />
                {data.summary.opportunities} opportunities
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {displayedInsights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 border-l-4 rounded-r-lg bg-gray-50 ${getInsightBorderColor(insight.type, insight.impact)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type, insight.impact)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {insight.title}
                    </h4>
                    {insight.amount && (
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(insight.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {insight.description}
                  </p>
                  {insight.recommendation && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      💡 {insight.recommendation}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {insight.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {insight.category}
                      </span>
                    )}
                    {insight.percentage && (
                      <span className={`text-xs font-medium ${
                        insight.percentage > 0 ? 'text-red-600' : 'text-green-600'
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
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAll ? 'Show Less' : `Show All ${data.insights.length} Insights`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}