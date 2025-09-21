import { PresetCategory } from '@prisma/client'

export const DEFAULT_PRESETS = [
  {
    id: 'default-overview',
    name: 'Financial Overview',
    description: 'A comprehensive view of your financial health with key metrics and insights',
    category: PresetCategory.DEFAULT,
    tags: ['overview', 'dashboard', 'comprehensive'],
    isPublic: true,
    layoutData: [
      { i: 'welcome-banner', x: 0, y: 0, w: 12, h: 3 },
      { i: 'monthly-summary', x: 0, y: 3, w: 12, h: 4 },
      { i: 'spending-chart', x: 0, y: 7, w: 6, h: 5 },
      { i: 'category-breakdown', x: 6, y: 7, w: 6, h: 5 },
      { i: 'bank-accounts', x: 0, y: 12, w: 12, h: 4 },
      { i: 'transaction-list', x: 0, y: 16, w: 12, h: 6 }
    ],
    widgetConfigs: {
      'spending-chart': { period: '30d', chartType: 'area' },
      'category-breakdown': { period: '30d', chartType: 'pie' },
      'transaction-list': { limit: 10, showFilters: true }
    },
    usageCount: 0
  },
  {
    id: 'budget-focused',
    name: 'Budget Management',
    description: 'Focus on budgeting with spending insights and budget tracking',
    category: PresetCategory.DEFAULT,
    tags: ['budget', 'spending', 'management'],
    isPublic: true,
    layoutData: [
      { i: 'welcome-banner', x: 0, y: 0, w: 12, h: 3 },
      { i: 'budget-overview', x: 0, y: 3, w: 12, h: 6 },
      { i: 'spending-insights', x: 0, y: 9, w: 12, h: 5 },
      { i: 'category-breakdown', x: 0, y: 14, w: 6, h: 5 },
      { i: 'spending-chart', x: 6, y: 14, w: 6, h: 5 },
      { i: 'transaction-list', x: 0, y: 19, w: 12, h: 6 }
    ],
    widgetConfigs: {
      'spending-chart': { period: '30d', chartType: 'bar' },
      'category-breakdown': { period: '30d', chartType: 'doughnut' },
      'transaction-list': { limit: 15, showFilters: true }
    },
    usageCount: 0
  },
  {
    id: 'analytics-deep-dive',
    name: 'Analytics Dashboard',
    description: 'Deep dive into your spending patterns with advanced analytics and charts',
    category: PresetCategory.DEFAULT,
    tags: ['analytics', 'charts', 'insights'],
    isPublic: true,
    layoutData: [
      { i: 'monthly-summary', x: 0, y: 0, w: 12, h: 4 },
      { i: 'spending-chart', x: 0, y: 4, w: 8, h: 6 },
      { i: 'category-breakdown', x: 8, y: 4, w: 4, h: 6 },
      { i: 'spending-insights', x: 0, y: 10, w: 12, h: 5 },
      { i: 'transaction-list', x: 0, y: 15, w: 8, h: 6 },
      { i: 'bank-accounts', x: 8, y: 15, w: 4, h: 6 }
    ],
    widgetConfigs: {
      'spending-chart': { period: '90d', chartType: 'line' },
      'category-breakdown': { period: '90d', chartType: 'pie' },
      'transaction-list': { limit: 20, showFilters: true }
    },
    usageCount: 0
  },
  {
    id: 'simple-starter',
    name: 'Simple Start',
    description: 'A clean, minimal layout perfect for getting started',
    category: PresetCategory.TEMPLATE,
    tags: ['simple', 'minimal', 'starter'],
    isPublic: true,
    layoutData: [
      { i: 'welcome-banner', x: 0, y: 0, w: 12, h: 3 },
      { i: 'monthly-summary', x: 0, y: 3, w: 12, h: 4 },
      { i: 'spending-chart', x: 0, y: 7, w: 12, h: 5 },
      { i: 'transaction-list', x: 0, y: 12, w: 12, h: 6 }
    ],
    widgetConfigs: {
      'spending-chart': { period: '30d', chartType: 'area' },
      'transaction-list': { limit: 8, showFilters: false }
    },
    usageCount: 0
  },
  {
    id: 'account-manager',
    name: 'Account Manager',
    description: 'Focus on account management and transaction monitoring',
    category: PresetCategory.TEMPLATE,
    tags: ['accounts', 'transactions', 'monitoring'],
    isPublic: true,
    layoutData: [
      { i: 'welcome-banner', x: 0, y: 0, w: 12, h: 3 },
      { i: 'bank-accounts', x: 0, y: 3, w: 12, h: 5 },
      { i: 'transaction-list', x: 0, y: 8, w: 8, h: 8 },
      { i: 'monthly-summary', x: 8, y: 8, w: 4, h: 4 },
      { i: 'category-breakdown', x: 8, y: 12, w: 4, h: 4 }
    ],
    widgetConfigs: {
      'transaction-list': { limit: 25, showFilters: true },
      'category-breakdown': { period: '30d', chartType: 'doughnut' }
    },
    usageCount: 0
  },
  {
    id: 'investor-view',
    name: 'Investor Dashboard',
    description: 'Track spending trends and financial insights for investment planning',
    category: PresetCategory.TEMPLATE,
    tags: ['investor', 'trends', 'planning'],
    isPublic: true,
    layoutData: [
      { i: 'monthly-summary', x: 0, y: 0, w: 6, h: 4 },
      { i: 'spending-insights', x: 6, y: 0, w: 6, h: 5 },
      { i: 'spending-chart', x: 0, y: 4, w: 6, h: 6 },
      { i: 'category-breakdown', x: 6, y: 5, w: 6, h: 5 },
      { i: 'budget-overview', x: 0, y: 10, w: 12, h: 6 },
      { i: 'bank-accounts', x: 0, y: 16, w: 12, h: 4 }
    ],
    widgetConfigs: {
      'spending-chart': { period: '180d', chartType: 'line' },
      'category-breakdown': { period: '90d', chartType: 'pie' }
    },
    usageCount: 0
  }
]