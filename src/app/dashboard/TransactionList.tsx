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
  enablePagination?: boolean
}

export default function TransactionList({
  limit,
  showFilters = true,
  enablePagination = false
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

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

  const fetchData = async (isLoadMore = false) => {
    try {
      const currentOffset = isLoadMore ? offset : 0
      const params = new URLSearchParams()

      if (limit && !enablePagination) params.append('limit', limit.toString())
      else if (enablePagination) params.append('limit', '20')

      params.append('offset', currentOffset.toString())
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (dateRange) params.append('days', dateRange)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        if (isLoadMore) {
          setTransactions(prev => [...prev, ...data.transactions])
        } else {
          setTransactions(data.transactions)
          setOffset(0)
        }

        if (data.pagination) {
          setHasMore(data.pagination.hasMore)
          setTotalCount(data.pagination.total)
          if (isLoadMore) {
            setOffset(prev => prev + data.pagination.limit)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [searchTerm, selectedCategory, dateRange, limit, enablePagination])

  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    await fetchData(true)
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food and Drink': 'bg-amber-500/10 text-amber-700 border-amber-200',
      'Transportation': 'bg-blue-500/10 text-blue-700 border-blue-200',
      'Shopping': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'Entertainment': 'bg-pink-500/10 text-pink-700 border-pink-200',
      'Bills': 'bg-destructive/10 text-destructive border-destructive/20',
      'Healthcare': 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      'Other': 'bg-muted text-muted-foreground border-border'
    }
    return colors[category] || 'bg-muted text-muted-foreground border-border'
  }

  if (loading) {
    return (
      <div className="card-modern p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Recent Transactions
          </h3>

          {showFilters && (
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 text-sm min-w-[200px]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-modern text-sm min-w-[140px]"
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
                className="input-modern text-sm min-w-[130px]"
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

      <div className="divide-y divide-border">
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No transactions found. Try adjusting your filters or connect a bank account.
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-6 hover:bg-accent/50 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {transaction.merchantName || transaction.name}
                    </p>
                    <p className="text-sm font-semibold text-destructive">
                      -{formatCurrency(transaction.amount)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {transaction.account.name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination or View All */}
      {enablePagination && hasMore && (
        <div className="p-4 border-t border-border text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-minimal btn-primary disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : `Load More (${totalCount - transactions.length} remaining)`}
          </button>
        </div>
      )}

      {limit && !enablePagination && transactions.length >= limit && (
        <div className="p-4 border-t border-border text-center">
          <button
            onClick={() => window.location.href = '/dashboard/transactions'}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200 hover:underline"
          >
            View all transactions →
          </button>
        </div>
      )}

      {enablePagination && transactions.length > 0 && (
        <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
          Showing {transactions.length} of {totalCount} transactions
        </div>
      )}
    </div>
  )
}