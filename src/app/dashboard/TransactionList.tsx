'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  date: string
  name: string
  merchantName: string | null
  category: string
  account: {
    name: string
    type: string
  }
}

interface TransactionListProps {
  limit?: number
  showFilters?: boolean
}

export default function TransactionList({
  limit,
  showFilters = true
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState('30')

  const categories = [
    'all',
    'Food and Drink',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills',
    'Healthcare',
    'Other'
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams()

        if (limit) params.append('limit', limit.toString())
        if (selectedCategory !== 'all') params.append('category', selectedCategory)
        if (dateRange) params.append('days', dateRange)
        if (searchTerm) params.append('search', searchTerm)

        const response = await fetch(`/api/transactions?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setTransactions(data.transactions)
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [searchTerm, selectedCategory, dateRange, limit])


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food and Drink': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Bills': 'bg-red-100 text-red-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Transactions
          </h3>

          {showFilters && (
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No transactions found. Try adjusting your filters or connect a bank account.
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.merchantName || transaction.name}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      -{formatCurrency(transaction.amount)}
                    </p>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {transaction.account.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {limit && transactions.length >= limit && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => window.location.href = '/dashboard/transactions'}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all transactions →
          </button>
        </div>
      )}
    </div>
  )
}