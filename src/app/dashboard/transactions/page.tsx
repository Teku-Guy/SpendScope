'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  SlidersHorizontal,
  FileText,
  CreditCard,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

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

interface TransactionStats {
  totalTransactions: number
  totalSpent: number
  averageTransaction: number
  mostCommonCategory: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<TransactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState('30')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const categories = [
    'all',
    'Food and Drink',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills',
    'Healthcare',
    'Travel',
    'Education',
    'Personal Care',
    'Other'
  ]

  useEffect(() => {
    setOffset(0)
    fetchTransactions(true)
  }, [selectedCategory, dateRange, searchTerm, minAmount, maxAmount, sortBy, sortOrder])

  const fetchTransactions = async (reset = false) => {
    if (reset) {
      setLoading(true)
      setOffset(0)
    } else {
      setLoadingMore(true)
    }

    try {
      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams()

      params.append('limit', '20')
      params.append('offset', currentOffset.toString())
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (dateRange) params.append('days', dateRange)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/transactions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        let newTransactions = data.transactions

        // Apply amount filters (client-side for now)
        if (minAmount) {
          newTransactions = newTransactions.filter((t: Transaction) => t.amount >= parseFloat(minAmount))
        }
        if (maxAmount) {
          newTransactions = newTransactions.filter((t: Transaction) => t.amount <= parseFloat(maxAmount))
        }

        // Apply sorting (client-side for now)
        newTransactions.sort((a: Transaction, b: Transaction) => {
          let aValue, bValue
          switch (sortBy) {
            case 'amount':
              aValue = a.amount
              bValue = b.amount
              break
            case 'name':
              aValue = (a.merchantName || a.name).toLowerCase()
              bValue = (b.merchantName || b.name).toLowerCase()
              break
            case 'date':
            default:
              aValue = new Date(a.date).getTime()
              bValue = new Date(b.date).getTime()
              break
          }

          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })

        if (reset) {
          setTransactions(newTransactions)
          calculateStats(newTransactions)
        } else {
          setTransactions(prev => [...prev, ...newTransactions])
        }

        if (data.pagination) {
          setHasMore(data.pagination.hasMore)
          setTotalCount(data.pagination.total)
          if (!reset) {
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

  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    await fetchTransactions(false)
  }

  const calculateStats = (transactionData: Transaction[]) => {
    if (transactionData.length === 0) {
      setStats(null)
      return
    }

    const totalSpent = transactionData.reduce((sum, t) => sum + t.amount, 0)
    const averageTransaction = totalSpent / transactionData.length

    // Find most common category
    const categoryCount = transactionData.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommonCategory = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'

    setStats({
      totalTransactions: transactionData.length,
      totalSpent,
      averageTransaction,
      mostCommonCategory
    })
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
      'Travel': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
      'Education': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      'Personal Care': 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
      'Other': 'bg-muted text-muted-foreground border-border'
    }
    return colors[category] || 'bg-muted text-muted-foreground border-border'
  }

  const handleSort = (field: 'date' | 'amount' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelection = new Set(selectedTransactions)
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId)
    } else {
      newSelection.add(transactionId)
    }
    setSelectedTransactions(newSelection)
  }

  const selectAllTransactions = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    }
  }

  const exportTransactions = () => {
    const exportData = transactions.map(t => ({
      Date: format(new Date(t.date), 'yyyy-MM-dd'),
      Description: t.merchantName || t.name,
      Category: t.category,
      Amount: t.amount,
      Account: t.account.name
    }))

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const SortIcon = ({ field }: { field: 'date' | 'amount' | 'name' }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
    return sortOrder === 'asc' ?
      <TrendingUp className="h-4 w-4 text-primary" /> :
      <TrendingDown className="h-4 w-4 text-primary" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={`loading-transaction-${i}`} className="bg-muted h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-muted h-96 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">View and manage all your financial transactions</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={exportTransactions} disabled={transactions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-destructive" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent)}</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Average Transaction</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.averageTransaction)}</p>
              </div>
            </div>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                <p className="text-lg font-bold text-foreground">{stats.mostCommonCategory}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="card-modern p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10 text-sm"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-modern text-sm"
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
              className="input-modern text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>

            {/* Amount Range */}
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min $"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="input-modern text-sm"
              />
              <input
                type="number"
                placeholder="Max $"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="input-modern text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="card-modern overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">
              Transactions ({transactions.length})
            </h3>
            {selectedTransactions.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTransactions.size} selected
                </span>
                <Button size="sm" variant="outline">
                  Categorize
                </Button>
              </div>
            )}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No transactions found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or connect a bank account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.size === transactions.length && transactions.length > 0}
                      onChange={selectAllTransactions}
                      className="rounded border-border text-primary focus:ring-primary/20"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center space-x-1 hover:text-foreground"
                    >
                      <span>Date</span>
                      <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-foreground"
                    >
                      <span>Description</span>
                      <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center space-x-1 hover:text-foreground ml-auto"
                    >
                      <span>Amount</span>
                      <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-accent/50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id)}
                        onChange={() => toggleTransactionSelection(transaction.id)}
                        className="rounded border-border text-primary focus:ring-primary/20"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {transaction.merchantName || transaction.name}
                      </div>
                      {transaction.merchantName && transaction.merchantName !== transaction.name && (
                        <div className="text-sm text-muted-foreground">{transaction.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {transaction.account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-destructive">
                      -{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="px-6 py-4 border-t border-border text-center">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {loadingMore ? 'Loading...' : `Load More (${totalCount - transactions.length} remaining)`}
            </Button>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="px-6 py-4 border-t border-border text-center text-sm text-muted-foreground">
            Showing {transactions.length} of {totalCount} transactions
          </div>
        )}
      </div>
    </div>
  )
}