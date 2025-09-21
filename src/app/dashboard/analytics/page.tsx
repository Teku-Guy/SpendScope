'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Target,
  AlertTriangle,
  PieChart,
  BarChart3,
  LineChart,
  Download,
  RefreshCw,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import SpendingChart from '../SpendingChart'
import CategoryBreakdown from '../CategoryBreakdown'
import SpendingInsights from '../SpendingInsights'

interface AnalyticsData {
  totalSpent: number
  totalTransactions: number
  averageTransaction: number
  topCategory: string
  monthlyGrowth: number
  budgetUtilization: number
  savingsGoal: number
  currentSavings: number
}

interface ForecastData {
  forecasts: Array<{
    category: string
    currentSpending: number
    forecastedSpending: number
    budgetLimit?: number
    riskLevel: 'low' | 'medium' | 'high'
    daysRemaining: number
    averageDailySpending: number
    recommendedDailySpending: number
  }>
  monthlyForecast: {
    totalCurrentSpending: number
    totalForecastedSpending: number
    totalBudgetLimit: number
    overallRiskLevel: 'low' | 'medium' | 'high'
    categoriesAtRisk: number
    recommendations: string[]
  }
}

interface MonthlyTrend {
  month: string
  spending: number
  income: number
  savings: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '7d' | '90d' | '1y'>('30d')
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line'>('area')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hiddenWidgets, setHiddenWidgets] = useState<Set<string>>(new Set())

  const periods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' }
  ]

  useEffect(() => {
    fetchAnalyticsData()
    fetchForecastData()
    fetchMonthlyTrends()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))

      setAnalyticsData({
        totalSpent: 3250.75,
        totalTransactions: 142,
        averageTransaction: 22.89,
        topCategory: 'Food & Dining',
        monthlyGrowth: -5.2,
        budgetUtilization: 78.5,
        savingsGoal: 5000,
        currentSavings: 2340
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    }
  }

  const fetchForecastData = async () => {
    try {
      const response = await fetch('/api/analytics/spending-forecast')
      const data = await response.json()
      if (data.success) {
        setForecastData(data)
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error)
    }
  }

  const fetchMonthlyTrends = async () => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 800))

      setMonthlyTrends([
        { month: 'Jan', spending: 2800, income: 5000, savings: 2200 },
        { month: 'Feb', spending: 3100, income: 5000, savings: 1900 },
        { month: 'Mar', spending: 2950, income: 5200, savings: 2250 },
        { month: 'Apr', spending: 3250, income: 5000, savings: 1750 },
        { month: 'May', spending: 3050, income: 5100, savings: 2050 },
        { month: 'Jun', spending: 3200, income: 4900, savings: 1700 }
      ])
    } catch (error) {
      console.error('Error fetching monthly trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'medium': return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
      default: return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
    }
  }

  const toggleWidget = (widgetId: string) => {
    const newHidden = new Set(hiddenWidgets)
    if (newHidden.has(widgetId)) {
      newHidden.delete(widgetId)
    } else {
      newHidden.add(widgetId)
    }
    setHiddenWidgets(newHidden)
  }

  const isWidgetHidden = (widgetId: string) => hiddenWidgets.has(widgetId)

  const exportAnalytics = () => {
    const data = {
      analytics: analyticsData,
      forecast: forecastData,
      trends: monthlyTrends,
      period: selectedPeriod,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={`loading-stat-${i}`} className="bg-muted h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-muted h-96 rounded-lg"></div>
            <div className="bg-muted h-96 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your spending patterns</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '30d' | '7d' | '90d' | '1y')}
            className="input-modern text-sm bg-background text-foreground"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value} className="bg-background text-foreground">{period.label}</option>
            ))}
          </select>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportAnalytics} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Widget Visibility Controls */}
      <div className="card-modern p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Widget Visibility</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Show/Hide widgets:</span>
            {['overview', 'charts', 'forecast', 'insights'].map(widget => (
              <button
                key={widget}
                onClick={() => toggleWidget(widget)}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                  isWidgetHidden(widget) ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                }`}
              >
                {isWidgetHidden(widget) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span className="capitalize">{widget}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      {!isWidgetHidden('overview') && analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(analyticsData.totalSpent)}</p>
                <div className="flex items-center mt-1">
                  {analyticsData.monthlyGrowth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                  )}
                  <span className={`text-sm ml-1 ${analyticsData.monthlyGrowth >= 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {Math.abs(analyticsData.monthlyGrowth)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.totalTransactions}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(analyticsData.averageTransaction)} avg</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Target className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Budget Usage</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.budgetUtilization}%</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      analyticsData.budgetUtilization > 90 ? 'bg-destructive' :
                      analyticsData.budgetUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(analyticsData.budgetUtilization, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Savings Progress</p>
                <p className="text-2xl font-bold text-foreground">
                  {((analyticsData.currentSavings / analyticsData.savingsGoal) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(analyticsData.currentSavings)} of {formatCurrency(analyticsData.savingsGoal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!isWidgetHidden('charts') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-modern">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Spending Trends</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as 'area' | 'bar' | 'line')}
                    className="input-modern text-sm px-2 py-1 bg-background text-foreground"
                  >
                    <option value="area" className="bg-background text-foreground">Area</option>
                    <option value="bar" className="bg-background text-foreground">Bar</option>
                    <option value="line" className="bg-background text-foreground">Line</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4">
              <SpendingChart period={selectedPeriod} chartType={chartType} />
            </div>
          </div>

          <div className="card-modern">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Category Breakdown</h3>
            </div>
            <div className="p-4">
              <CategoryBreakdown period={selectedPeriod} chartType="pie" />
            </div>
          </div>
        </div>
      )}

      {/* Spending Forecast */}
      {!isWidgetHidden('forecast') && forecastData && (
        <div className="card-modern">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-foreground">Spending Forecast</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(forecastData.monthlyForecast.overallRiskLevel)}`}>
                {forecastData.monthlyForecast.overallRiskLevel.toUpperCase()} Risk
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Current Spending</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(forecastData.monthlyForecast.totalCurrentSpending)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Forecasted Spending</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(forecastData.monthlyForecast.totalForecastedSpending)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Categories at Risk</p>
                <p className="text-2xl font-bold text-destructive">
                  {forecastData.monthlyForecast.categoriesAtRisk}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground">Category Forecasts</h4>
              {forecastData.forecasts.slice(0, 5).map((forecast) => (
                <div key={`forecast-${forecast.category}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{forecast.category}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(forecast.riskLevel)}`}>
                        {forecast.riskLevel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(forecast.currentSpending)} → {formatCurrency(forecast.forecastedSpending)}
                      </span>
                      {forecast.budgetLimit && (
                        <span className="text-xs text-muted-foreground">
                          Budget: {formatCurrency(forecast.budgetLimit)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-foreground mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {forecastData.monthlyForecast.recommendations.map((recommendation, index) => (
                  <li key={`recommendation-${index}-${recommendation.slice(0, 20)}`} className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {!isWidgetHidden('trends') && monthlyTrends.length > 0 && (
        <div className="card-modern">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Monthly Trends</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-sm font-medium text-muted-foreground">Month</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Spending</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Income</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Savings</th>
                    <th className="text-right py-2 text-sm font-medium text-muted-foreground">Savings Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTrends.map((trend) => {
                    const savingsRate = trend.income > 0 ? (trend.savings / trend.income * 100) : 0
                    return (
                      <tr key={`trend-${trend.month}`} className="border-b border-border">
                        <td className="py-3 text-sm font-medium text-foreground">{trend.month}</td>
                        <td className="py-3 text-sm text-right text-foreground">{formatCurrency(trend.spending)}</td>
                        <td className="py-3 text-sm text-right text-foreground">{formatCurrency(trend.income)}</td>
                        <td className="py-3 text-sm text-right text-foreground">{formatCurrency(trend.savings)}</td>
                        <td className={`py-3 text-sm text-right font-medium ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 10 ? 'text-amber-600' : 'text-destructive'}`}>
                          {savingsRate.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Spending Insights */}
      {!isWidgetHidden('insights') && (
        <SpendingInsights />
      )}
    </div>
  )
}