'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/')
      return
    }
    fetchBudgets()
  }, [session, status, router])

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
    setError(null)

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Budget name is required')
      }
      if (!formData.category) {
        throw new Error('Please select a category')
      }
      if (!formData.budgetLimit || parseFloat(formData.budgetLimit) <= 0) {
        throw new Error('Budget limit must be greater than 0')
      }

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          budgetLimit: parseFloat(formData.budgetLimit),
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Add the new budget to the list with calculated fields
        setBudgets(prev => [...prev, result.budget])
        setShowCreateModal(false)
        setFormData({ name: '', category: '', budgetLimit: '' })
        setError(null)
      } else {
        const errorMessage = result.error || `Failed to create budget (${response.status})`
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error creating budget:', error)
      setError(error instanceof Error ? error.message : 'Failed to create budget')
    } finally {
      setCreating(false)
    }
  }

  const handleEditBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBudget) return

    setUpdating(true)
    setError(null)

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Budget name is required')
      }
      if (!formData.budgetLimit || parseFloat(formData.budgetLimit) <= 0) {
        throw new Error('Budget limit must be greater than 0')
      }

      const response = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
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
        setError(null)
      } else {
        setError(result.error || 'Failed to update budget')
      }
    } catch (error) {
      console.error('Error updating budget:', error)
      setError(error instanceof Error ? error.message : 'Failed to update budget')
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
    setError(null)
    setShowEditModal(true)
  }

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-destructive bg-destructive/10 border-destructive/20'
    if (percentage >= 80) return 'text-amber-600 bg-amber-500/10 border-amber-500/20'
    return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
  }

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 100) {
      return <TrendingUpIcon className="h-5 w-5 text-destructive" />
    }
    return <TrendingDownIcon className="h-5 w-5 text-emerald-500" />
  }

  // Show loading while checking authentication or loading data
  if (status === 'loading' || loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={`loading-${i}`} className="bg-muted h-32 rounded-lg mb-4"></div>
          ))}
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect is happening)
  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground">Manage your spending limits and track progress</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>

      {/* Budget Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-modern p-6">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Budgets</p>
              <p className="text-2xl font-bold text-foreground">{budgets.length}</p>
            </div>
          </div>
        </div>

        <div className="card-modern p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingDownIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">On Track</p>
              <p className="text-2xl font-bold text-foreground">
                {budgets.filter(b => b.percentage < 80).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-modern p-6">
          <div className="flex items-center">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingUpIcon className="h-6 w-6 text-destructive" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Over Budget</p>
              <p className="text-2xl font-bold text-foreground">
                {budgets.filter(b => b.percentage >= 100).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <TrendingUpIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No budgets yet</h3>
          <p className="text-muted-foreground mb-4">Create your first budget to start tracking your spending</p>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Budget
          </Button>
        </div>
      ) : (
        <div className="card-modern overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">Your Budgets</h3>
          </div>
          <div className="divide-y divide-border">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="text-lg font-medium text-foreground">{budget.name}</h4>
                      <p className="text-sm text-muted-foreground">{budget.category}</p>
                    </div>
                    {getTrendIcon(budget.percentage)}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Spent / Budget</p>
                      <p className="text-lg font-semibold text-foreground">
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
                    <span className={`font-medium px-2 py-1 rounded-full border ${getBudgetStatusColor(budget.percentage)}`}>
                      {budget.percentage.toFixed(1)}% used
                    </span>
                    <span className={`font-medium ${budget.remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                      ${Math.abs(budget.remaining).toFixed(2)} {budget.remaining < 0 ? 'over' : 'remaining'}
                    </span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        budget.percentage >= 100 ? 'bg-destructive' :
                        budget.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
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
        onClose={() => {
          setShowCreateModal(false)
          setError(null)
          setFormData({ name: '', category: '', budgetLimit: '' })
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

      {/* Edit Budget Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingBudget(null)
          setError(null)
          setFormData({ name: '', category: '', budgetLimit: '' })
        }}
        title="Edit Budget"
        size="md"
      >
        <form onSubmit={handleEditBudget} className="space-y-5">
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
            helper="Update your budget name"
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Category</label>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/30">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="font-medium">{formData.category}</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Category cannot be changed after creation</span>
            </p>
          </div>

          <Input
            label="Budget Limit"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.budgetLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: e.target.value }))}
            required
            helper="Update your monthly spending limit for this category"
            icon={
              <span className="text-muted-foreground font-medium">$</span>
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setEditingBudget(null)
                setError(null)
                setFormData({ name: '', category: '', budgetLimit: '' })
              }}
              disabled={updating}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updating || !formData.name.trim() || !formData.budgetLimit}
              className="min-w-[120px]"
            >
              {updating ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Budget'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}