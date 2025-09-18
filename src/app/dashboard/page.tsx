'use client'

import { useSession } from 'next-auth/react'
import { useState, useCallback, useMemo } from 'react'
import PlaidLink from '@/components/plaid/PlaidLink'
import BankAccountsList from '@/components/plaid/BankAccountsList'
import TransactionList from './TransactionList'
import SpendingChart from './SpendingChart'
import MonthlySummary from './MonthlySummary'
import CategoryBreakdown from './CategoryBreakdown'
import BudgetOverview from './BudgetOverview'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePlaidSuccess = useCallback(() => {
    // Refresh all components when a new account is connected
    setRefreshKey(prev => prev + 1)
  }, [])

  // Memoize the PlaidLink component to prevent unnecessary re-renders
  const plaidLinkComponent = useMemo(() => (
    <PlaidLink onSuccess={handlePlaidSuccess} />
  ), [handlePlaidSuccess])

  if (!session) {
    return null // This will be handled by the layout redirect
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-gray-600 mb-4">
            Here&apos;s an overview of your financial activity
          </p>

          {/* Plaid Connect Button */}
          {plaidLinkComponent}
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Connected Accounts
          </h2>
          <BankAccountsList key={`accounts-${refreshKey}`} />
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <MonthlySummary key={`monthly-${refreshKey}`} />

      {/* Budget Overview */}
      <BudgetOverview key={`budget-${refreshKey}`} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending Chart */}
        <SpendingChart
          key={`spending-${refreshKey}`}
          period="30d"
          chartType="area"
        />

        {/* Category Breakdown */}
        <CategoryBreakdown
          key={`category-${refreshKey}`}
          period="30d"
          chartType="pie"
        />
      </div>

      {/* Recent Transactions */}
      <TransactionList
        key={`transactions-${refreshKey}`}
        limit={10}
        showFilters={true}
      />
    </div>
  )
}