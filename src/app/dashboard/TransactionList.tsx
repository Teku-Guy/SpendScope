'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

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
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = enablePagination ? 10 : (limit || 10)

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

  const fetchData = async (pageNumber?: number) => {
    try {
      setLoading(pageNumber === undefined)
      setLoadingMore(pageNumber !== undefined)

      const params = new URLSearchParams()

      // Calculate offset based on page number or current page
      const targetPage = pageNumber !== undefined ? pageNumber : currentPage
      const currentOffset = (targetPage - 1) * itemsPerPage

      params.append('limit', itemsPerPage.toString())
      params.append('offset', currentOffset.toString())

      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (dateRange) params.append('days', dateRange)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)

        if (data.pagination) {
          setHasMore(data.pagination.hasMore)
          setTotalCount(data.pagination.total)
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
    setCurrentPage(1) // Reset to first page when filters change
    fetchData(1)
  }, [searchTerm, selectedCategory, dateRange, limit, enablePagination])

  // Only fetch data when current page changes (not on initial load or filter changes)
  useEffect(() => {
    if (currentPage > 1) {
      fetchData(currentPage)
    }
  }, [currentPage])

  const loadMore = async () => {
    if (!hasMore || loadingMore || enablePagination) return
    setLoadingMore(true)

    const params = new URLSearchParams()
    const currentOffset = transactions.length

    params.append('limit', itemsPerPage.toString())
    params.append('offset', currentOffset.toString())

    if (selectedCategory !== 'all') params.append('category', selectedCategory)
    if (dateRange) params.append('days', dateRange)
    if (searchTerm) params.append('search', searchTerm)

    try {
      const response = await fetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(prev => {
          const existingIds = new Set(prev.map((t: Transaction) => t.id))
          const newTransactions = data.transactions.filter((t: Transaction) => !existingIds.has(t.id))
          return [...prev, ...newTransactions]
        })

        if (data.pagination) {
          setHasMore(data.pagination.hasMore)
          setTotalCount(data.pagination.total)
        }
      }
    } catch (error) {
      console.error('Error loading more transactions:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Pagination functions
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food and Drink': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      'Transportation': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
      'Shopping': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
      'Entertainment': 'bg-pink-500/10 text-pink-700 border-pink-500/20',
      'Bills': 'bg-destructive/10 text-destructive border-destructive/20',
      'Healthcare': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      'Other': 'bg-muted text-muted-foreground border-border'
    }
    return colors[category] || 'bg-muted text-muted-foreground border-border'
  }

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4" />
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={`loading-${i}`} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header - Responsive design */}
      <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
        <div className="space-y-3 sm:space-y-0">
          {/* Title and transaction count */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Recent Transactions
              </h3>
              {totalCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {totalCount.toLocaleString()} total transactions
                </p>
              )}
            </div>

            {/* Mobile: Show result count */}
            <div className="sm:hidden mt-2">
              {enablePagination && totalCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
          </div>

          {/* Filters - Mobile responsive layout */}
          {showFilters && (
            <div className="transaction-filters space-y-3 sm:space-y-0">
              {/* Mobile: Stack filters vertically */}
              <div className="sm:hidden space-y-3">
                {/* Search - Full width on mobile */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Mobile: Filters in a grid */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent truncate"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All' : category.length > 12 ? category.substring(0, 12) + '...' : category}
                      </option>
                    ))}
                  </select>

                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">3 months</option>
                    <option value="365">1 year</option>
                  </select>
                </div>
              </div>

              {/* Desktop: Horizontal layout */}
              <div className="hidden sm:flex sm:items-center sm:justify-end sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 pl-10 text-sm w-48 lg:w-56 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm min-w-[140px] bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 text-sm min-w-[130px] bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {transactions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground p-4">
              No transactions found. Try adjusting your filters or connect a bank account.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item p-3 sm:p-4 hover:bg-accent/50 transition-colors duration-200">
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {transaction.merchantName || transaction.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {transaction.account.name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-destructive">
                        -{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(transaction.date), 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(transaction.category)}`}>
                      {transaction.category.length > 15 ? transaction.category.substring(0, 15) + '...' : transaction.category}
                    </span>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate pr-4">
                          {transaction.merchantName || transaction.name}
                        </p>
                        <p className="text-sm font-semibold text-destructive flex-shrink-0">
                          -{formatCurrency(transaction.amount)}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls - Mobile responsive */}
      {enablePagination && totalPages > 1 && (
        <div className="border-t border-border bg-card">
          {/* Mobile Pagination */}
          <div className="sm:hidden p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground">
                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {/* Show fewer pages on mobile */}
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 3) {
                    pageNum = i + 1
                  } else if (currentPage === 1) {
                    pageNum = i + 1
                  } else if (currentPage === totalPages) {
                    pageNum = totalPages - 2 + i
                  } else {
                    pageNum = currentPage - 1 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      disabled={loadingMore}
                      className={`w-8 h-8 text-sm rounded-md border transition-colors duration-200 ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-accent'
                      }`}
                    >
                      {loadingMore && currentPage === pageNum ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        pageNum
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden sm:block p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount.toLocaleString()} transactions
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1 || loadingMore}
                  className="p-2 bg-background border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        disabled={loadingMore}
                        className={`w-8 h-8 text-sm rounded-md border transition-colors duration-200 ${
                          currentPage === pageNum
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border hover:bg-accent'
                        }`}
                      >
                        {loadingMore && currentPage === pageNum ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          pageNum
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || loadingMore}
                  className="p-2 bg-background border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load More for non-paginated view */}
      {!enablePagination && hasMore && (
        <div className="p-4 border-t border-border text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 bg-primary text-primary-foreground border border-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
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
    </div>
  )
}