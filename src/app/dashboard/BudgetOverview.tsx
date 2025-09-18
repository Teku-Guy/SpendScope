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

  // Form state
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    budgetLimit: '',
  })

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
      } else {
        alert(result.error || 'Failed to create budget')
      }
    } catch (error) {
      console.error('Error creating budget:', error)
      alert('Failed to create budget')
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
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getBudgetStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Over budget'
    if (percentage >= 80) return 'Close to limit'
    return 'On track'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Budget Overview</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-800">Budget Alerts</h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex justify-between items-center">
                <p className="text-sm text-yellow-700">{alert.message}</p>
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
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DollarSignIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
          <p className="text-gray-500 mb-4">Create your first budget to start tracking your spending</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div key={budget.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">{budget.name}</h3>
                  <p className="text-sm text-gray-500">{budget.category}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getBudgetStatusColor(budget.percentage)}`}>
                  {getBudgetStatusText(budget.percentage)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Spent</span>
                  <span className="font-medium">${budget.currentSpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">${budget.budgetLimit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining</span>
                  <span className={`font-medium ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(budget.remaining).toFixed(2)} {budget.remaining < 0 ? 'over' : 'left'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getBudgetStatusColor(budget.percentage)}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {budget.percentage.toFixed(1)}% of budget used
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Budget"
      >
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <Input
            label="Budget Name"
            value={newBudget.name}
            onChange={(e) => setNewBudget(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Monthly Groceries"
            required
          />

          <Select
            label="Category"
            value={newBudget.category}
            onChange={(e) => setNewBudget(prev => ({ ...prev, category: e.target.value }))}
            options={categories}
            required
          />

          <Input
            label="Budget Limit"
            type="number"
            step="0.01"
            min="0"
            value={newBudget.budgetLimit}
            onChange={(e) => setNewBudget(prev => ({ ...prev, budgetLimit: e.target.value }))}
            placeholder="0.00"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Budget'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}