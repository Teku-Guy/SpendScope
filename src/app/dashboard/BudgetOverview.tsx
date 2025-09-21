'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, AlertTriangleIcon, CheckCircleIcon, DollarSignIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface Budget {
  id: string
  name: string
  category: string
  budgetLimit: number
  currentSpend: number
  percentage: number
  remaining: number
}

interface BudgetAlert {
  id: string
  type: string
  category?: string
  message: string
  severity: string
  isRead: boolean
  createdAt: string
}

export default function BudgetOverview() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    budgetLimit: '',
  })

  // Alias for modal compatibility
  const formData = newBudget
  const setFormData = setNewBudget

  const categories = [
    { value: 'Food & Dining', label: 'Food & Dining' },
    { value: 'Shopping', label: 'Shopping' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'Bills & Utilities', label: 'Bills & Utilities' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Education', label: 'Education' },
    { value: 'Personal Care', label: 'Personal Care' },
    { value: 'Other', label: 'Other' },
  ]

  useEffect(() => {
    fetchBudgets()
    fetchAlerts()
  }, [])

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets')
      const result = await response.json()
      if (result.success) {
        setBudgets(result.budgets)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/budget-alerts?unread=true')
      const result = await response.json()
      if (result.success) {
        setAlerts(result.alerts)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newBudget.name,
          category: newBudget.category,
          budgetLimit: parseFloat(newBudget.budgetLimit),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setBudgets(prev => [...prev, result.budget])
        setShowCreateModal(false)
        setNewBudget({ name: '', category: '', budgetLimit: '' })
        setError(null)
      } else {
        setError(result.error || 'Failed to create budget')
      }
    } catch (err) {
      console.error('Error creating budget:', err)
      setError('Failed to create budget. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const markAlertAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/budget-alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      })

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      }
    } catch (error) {
      console.error('Error marking alert as read:', error)
    }
  }

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive'
    if (percentage >= 80) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getBudgetStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Over budget'
    if (percentage >= 80) return 'Close to limit'
    return 'On track'
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
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={`loading-${i}`} className="bg-muted h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Budget Overview</h2>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Budget
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-6">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <AlertTriangleIcon className="h-5 w-5 text-amber-600 mr-2" />
                <h3 className="font-medium text-foreground">Budget Alerts</h3>
              </div>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex justify-between items-center">
                    <p className="text-sm text-foreground/80">{alert.message}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAlertAsRead(alert.id)}
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Cards */}
          {budgets.length === 0 ? (
            <div className="text-center py-12 bg-accent/20 rounded-lg">
              <DollarSignIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No budgets yet</h3>
              <p className="text-muted-foreground mb-4">Create your first budget to start tracking your spending</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Budget
              </Button>
            </div>
          ) : (
            <div className="budget-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((budget) => (
                <div key={budget.id} className="bg-accent/20 border border-border rounded-lg p-4 hover:bg-accent/30 transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{budget.name}</h3>
                      <p className="text-sm text-muted-foreground">{budget.category}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full text-white ${getBudgetStatusColor(budget.percentage)}`}>
                      {getBudgetStatusText(budget.percentage)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Spent</span>
                      <span className="font-semibold text-foreground">${budget.currentSpend.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-semibold text-foreground">${budget.budgetLimit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className={`font-semibold ${budget.remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        ${Math.abs(budget.remaining).toFixed(2)} {budget.remaining < 0 ? 'over' : 'left'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2.5 border border-border/50">
                      <div
                        className={`h-full rounded-full ${getBudgetStatusColor(budget.percentage)} transition-all duration-300`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      {budget.percentage.toFixed(1)}% of budget used
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Budget Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setError(null)
          setNewBudget({ name: '', category: '', budgetLimit: '' })
        }}
        title="Create New Budget"
        size="md"
      >
        <form onSubmit={handleCreateBudget} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            </div>
          )}

          <Input
            label="Budget Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Monthly Groceries, Entertainment"
            required
            helper="Give your budget a descriptive name"
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            options={[
              { value: '', label: 'Select a category' },
              ...categories
            ]}
            required
            helper="Choose the spending category this budget will track"
          />

          <Input
            label="Budget Limit"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.budgetLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: e.target.value }))}
            placeholder="500.00"
            required
            helper="Set your monthly spending limit for this category"
            icon={
              <span className="text-muted-foreground font-medium">$</span>
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false)
                setError(null)
                setFormData({ name: '', category: '', budgetLimit: '' })
              }}
              disabled={creating}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating || !formData.name.trim() || !formData.category || !formData.budgetLimit}
              className="min-w-[120px]"
            >
              {creating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Budget'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}