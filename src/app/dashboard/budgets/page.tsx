'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, EditIcon, TrashIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
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
  createdAt: string
  updatedAt: string
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [formData, setFormData] = useState({
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
          name: formData.name,
          category: formData.category,
          budgetLimit: parseFloat(formData.budgetLimit),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setBudgets(prev => [...prev, result.budget])
        setShowCreateModal(false)
        setFormData({ name: '', category: '', budgetLimit: '' })
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

  const handleEditBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBudget) return

    setUpdating(true)

    try {
      const response = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          budgetLimit: parseFloat(formData.budgetLimit),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setBudgets(prev => prev.map(budget =>
          budget.id === editingBudget.id ? { ...budget, ...result.budget } : budget
        ))
        setShowEditModal(false)
        setEditingBudget(null)
        setFormData({ name: '', category: '', budgetLimit: '' })
      } else {
        alert(result.error || 'Failed to update budget')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      alert('Failed to update budget')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setBudgets(prev => prev.filter(budget => budget.id !== budgetId))
      } else {
        alert(result.error || 'Failed to delete budget')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Failed to delete budget')
    }
  }

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      name: budget.name,
      category: budget.category,
      budgetLimit: budget.budgetLimit.toString(),
    })
    setShowEditModal(true)
  }

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50'
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 100) {
      return <TrendingUpIcon className="h-5 w-5 text-red-500" />
    }
    return <TrendingDownIcon className="h-5 w-5 text-green-500" />
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg mb-4"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Manage your spending limits and track progress</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>

      {/* Budget Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Budgets</p>
              <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingDownIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">On Track</p>
              <p className="text-2xl font-bold text-gray-900">
                {budgets.filter(b => b.percentage < 80).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Over Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {budgets.filter(b => b.percentage >= 100).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets yet</h3>
          <p className="text-gray-500 mb-4">Create your first budget to start tracking your spending</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Budget
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Budgets</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{budget.name}</h4>
                      <p className="text-sm text-gray-500">{budget.category}</p>
                    </div>
                    {getTrendIcon(budget.percentage)}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Spent / Budget</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${budget.currentSpend.toFixed(2)} / ${budget.budgetLimit.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(budget)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`font-medium px-2 py-1 rounded-full ${getBudgetStatusColor(budget.percentage)}`}>
                      {budget.percentage.toFixed(1)}% used
                    </span>
                    <span className={`font-medium ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${Math.abs(budget.remaining).toFixed(2)} {budget.remaining < 0 ? 'over' : 'remaining'}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        budget.percentage >= 100 ? 'bg-red-500' :
                        budget.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Monthly Groceries"
            required
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            options={categories}
            required
          />

          <Input
            label="Budget Limit ($)"
            type="number"
            step="0.01"
            min="0"
            value={formData.budgetLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: e.target.value }))}
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

      {/* Edit Budget Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Budget"
      >
        <form onSubmit={handleEditBudget} className="space-y-4">
          <Input
            label="Budget Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Monthly Groceries"
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              {formData.category}
            </div>
            <p className="text-xs text-gray-500">Category cannot be changed after creation</p>
          </div>

          <Input
            label="Budget Limit ($)"
            type="number"
            step="0.01"
            min="0"
            value={formData.budgetLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: e.target.value }))}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Updating...' : 'Update Budget'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}