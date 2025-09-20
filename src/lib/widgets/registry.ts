import { Widget } from './types'

// Import dashboard components
import MonthlySummary from '@/app/dashboard/MonthlySummary'
import BudgetOverview from '@/app/dashboard/BudgetOverview'
import SpendingInsights from '@/app/dashboard/SpendingInsights'
import SpendingChart from '@/app/dashboard/SpendingChart'
import CategoryBreakdown from '@/app/dashboard/CategoryBreakdown'
import TransactionList from '@/app/dashboard/TransactionList'
import BankAccountsList from '@/components/plaid/BankAccountsList'

// Widget registry containing all available widgets
export const WIDGET_REGISTRY: Record<string, Widget> = {
  'welcome-banner': {
    id: 'welcome-banner',
    name: 'Welcome Banner',
    description: 'Welcome message and account connection',
    component: ({ session, plaidLinkComponent }: any) => (
      <div className="apple-card p-8 apple-blur">
        <h1 className="text-3xl font-bold text-foreground mb-3 letter-spacing-tight">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Here&apos;s an overview of your financial activity
        </p>
        {plaidLinkComponent}
      </div>
    ),
    defaultSize: { w: 12, h: 3, minW: 6, minH: 3 },
    configurable: false,
    category: 'overview',
    icon: 'Sparkles'
  },

  'bank-accounts': {
    id: 'bank-accounts',
    name: 'Connected Accounts',
    description: 'View and manage your connected bank accounts',
    component: BankAccountsList,
    defaultSize: { w: 12, h: 4, minW: 6, minH: 3 },
    configurable: false,
    category: 'accounts',
    icon: 'Building'
  },

  'monthly-summary': {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    description: 'Key financial metrics for the current month',
    component: MonthlySummary,
    defaultSize: { w: 12, h: 4, minW: 6, minH: 3 },
    configurable: false,
    category: 'overview',
    icon: 'Calendar'
  },

  'budget-overview': {
    id: 'budget-overview',
    name: 'Budget Overview',
    description: 'Track your budget progress and alerts',
    component: BudgetOverview,
    defaultSize: { w: 12, h: 6, minW: 6, minH: 4 },
    configurable: false,
    category: 'budget',
    icon: 'Target'
  },

  'spending-insights': {
    id: 'spending-insights',
    name: 'Spending Insights',
    description: 'AI-powered insights about your spending patterns',
    component: SpendingInsights,
    defaultSize: { w: 12, h: 5, minW: 6, minH: 4 },
    configurable: false,
    category: 'analytics',
    icon: 'Brain'
  },

  'spending-chart': {
    id: 'spending-chart',
    name: 'Spending Chart',
    description: 'Visual representation of your spending over time',
    component: ({ period = '30d', chartType = 'area', ...props }: any) => (
      <SpendingChart period={period} chartType={chartType} {...props} />
    ),
    defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
    configurable: true,
    category: 'analytics',
    icon: 'TrendingUp'
  },

  'category-breakdown': {
    id: 'category-breakdown',
    name: 'Category Breakdown',
    description: 'Breakdown of spending by category',
    component: ({ period = '30d', chartType = 'pie', ...props }: any) => (
      <CategoryBreakdown period={period} chartType={chartType} {...props} />
    ),
    defaultSize: { w: 6, h: 5, minW: 4, minH: 4 },
    configurable: true,
    category: 'analytics',
    icon: 'PieChart'
  },

  'transaction-list': {
    id: 'transaction-list',
    name: 'Recent Transactions',
    description: 'List of your most recent transactions',
    component: ({ limit = 10, showFilters = true, ...props }: any) => (
      <TransactionList limit={limit} showFilters={showFilters} {...props} />
    ),
    defaultSize: { w: 12, h: 6, minW: 6, minH: 4 },
    configurable: true,
    category: 'transactions',
    icon: 'List'
  }
}

// Helper functions
export const getWidget = (id: string): Widget | undefined => {
  return WIDGET_REGISTRY[id]
}

export const getWidgetsByCategory = (category: Widget['category']): Widget[] => {
  return Object.values(WIDGET_REGISTRY).filter(widget => widget.category === category)
}

export const getAllWidgets = (): Widget[] => {
  return Object.values(WIDGET_REGISTRY)
}

export const getAvailableWidgets = (): Widget[] => {
  return Object.values(WIDGET_REGISTRY).filter(widget => !widget.disabled)
}