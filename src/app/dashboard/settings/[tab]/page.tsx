'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import {
  User,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  Settings as SettingsIcon,
  CreditCard,
  Palette,
  Moon,
  Sun,
  Save,
  AlertCircle,
  CheckCircle,
  X,
  Mail,
  Clock,
  Globe,
  DollarSign,
  Info,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ColorSchemePicker } from '@/components/ui/ThemeSwitcher'
import { useTheme, type Theme } from '@/contexts/ThemeContext'
import Image from 'next/image'

interface UserSettings {
  emailNotifications: boolean
  budgetAlerts: boolean
  weeklyReports: boolean
  monthlyReports: boolean
  currency: string
  timezone: string
  theme: string
}

interface NotificationSettings {
  budgetExceeded: boolean
  largeTransaction: boolean
  weeklyDigest: boolean
  monthlyReport: boolean
  accountConnection: boolean
}

interface CategoryRules {
  color?: string
  isCustom?: boolean
}

interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: string;
}

interface ApiCategory {
  id: string;
  name: string;
  rules?: CategoryRules;
}

interface CategorySettings {
  id?: string
  name: string
  color: string
  isDefault: boolean
}

export default function SettingsTabPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const activeTab = params.tab as string || 'profile'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    timezone: 'America/Los_Angeles'
  })

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    budgetExceeded: true,
    largeTransaction: true,
    weeklyDigest: false,
    monthlyReport: true,
    accountConnection: true
  })

  // General settings
  const [generalSettings, setGeneralSettings] = useState<UserSettings>({
    emailNotifications: true,
    budgetAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
    currency: 'USD',
    timezone: 'America/New_York',
    theme: 'light'
  })

  // Category settings
  const [categories, setCategories] = useState<CategorySettings[]>([
    { id: '1', name: 'Food & Dining', color: '#f97316', isDefault: true },
    { id: '2', name: 'Transportation', color: '#3b82f6', isDefault: true },
    { id: '3', name: 'Shopping', color: '#8b5cf6', isDefault: true },
    { id: '4', name: 'Entertainment', color: '#ec4899', isDefault: true },
    { id: '5', name: 'Bills & Utilities', color: '#ef4444', isDefault: true },
    { id: '6', name: 'Healthcare', color: '#10b981', isDefault: true },
    { id: '7', name: 'Travel', color: '#6366f1', isDefault: true },
    { id: '8', name: 'Education', color: '#f59e0b', isDefault: true },
    { id: '9', name: 'Personal Care', color: '#06b6d4', isDefault: true },
    { id: '10', name: 'Other', color: '#6b7280', isDefault: true }
  ])

  const [newCategory, setNewCategory] = useState<CategorySettings>({
    name: '',
    color: '#3b82f6',
    isDefault: false
  })

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [syncingTransactions, setSyncingTransactions] = useState(false)

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
    { code: 'JPY', name: 'Japanese Yen (¥)' }
  ]

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'categories', name: 'Categories', icon: Palette },
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'data', name: 'Data & Privacy', icon: Shield }
  ]

  // Redirect to profile if tab doesn't exist
  useEffect(() => {
    const validTabs = tabs.map(tab => tab.id)
    if (!validTabs.includes(activeTab)) {
      router.replace('/dashboard/settings/profile')
    }
  }, [activeTab, router])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (!response.ok) {
          throw new Error('Failed to load settings')
        }

        const data = await response.json()

        if (data.profile) {
          setProfileData(prev => ({
            ...prev,
            name: data.profile.name || '',
            email: data.profile.email || '',
            timezone: data.profile.timezone || 'America/New_York'
          }))
        }

        if (data.notifications) {
          setNotifications(data.notifications)
        }

        if (data.general) {
          setGeneralSettings(data.general)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        showMessage('error', 'Failed to load settings')
      }
    }

    const loadCategories = async () => {
      try {
        const response = await fetch('/api/budget-categories')
        if (!response.ok) {
          throw new Error('Failed to load categories')
        }

        const data: ApiCategory[] = await response.json()
        const categoriesForUI: CategorySettings[] = data.map((cat: ApiCategory) => ({
          id: cat.id,
          name: cat.name,
          color: (cat.rules as CategoryRules)?.color || '#3b82f6',
          isDefault: !(cat.rules as CategoryRules)?.isCustom
        }))

        setCategories(prevCategories => [
          // Keep default categories
          ...prevCategories.filter(c => c.isDefault),
          // Add user's custom categories
          ...categoriesForUI.filter(c => !c.isDefault)
        ])
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    const loadBankAccounts = async () => {
      try {
        setLoadingAccounts(true)
        const response = await fetch('/api/accounts')
        if (!response.ok) {
          throw new Error('Failed to load bank accounts')
        }

        const data = await response.json()
        setBankAccounts(data.accounts || [])
      } catch (error) {
        console.error('Error loading bank accounts:', error)
      } finally {
        setLoadingAccounts(false)
      }
    }

    if (session?.user) {
      loadSettings()
      loadCategories()
      loadBankAccounts()
    }
  }, [session])

  const disconnectAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to disconnect "${accountName}"? This will remove all associated transaction data.`)) {
      return
    }

    try {
      const response = await fetch('/api/accounts/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect account')
      }

      // Remove account from state
      setBankAccounts(bankAccounts.filter(acc => acc.id !== accountId))
      showMessage('success', 'Account disconnected successfully')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to disconnect account';
      showMessage('error', message);
    }
  }

  const saveProfileSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: profileData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile settings')
      }

      showMessage('success', 'Profile settings saved successfully')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save profile settings';
      showMessage('error', message);
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save notification settings')
      }

      showMessage('success', 'Notification settings saved successfully')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save notification settings';
      showMessage('error', message);
    } finally {
      setLoading(false)
    }
  }

  const saveGeneralSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          general: generalSettings,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save general settings')
      }

      showMessage('success', 'General settings saved successfully')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to save general settings';
      showMessage('error', message);
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategory.name.trim()) return

    try {
      const response = await fetch('/api/budget-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.name,
          category: newCategory.name.toLowerCase().replace(/\s+/g, '_'),
          budgetLimit: 1000, // Default budget limit
          color: newCategory.color,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add category')
      }

      const addedCategory = await response.json()

      const categoryForUI: CategorySettings = {
        id: addedCategory.id,
        name: addedCategory.name,
        color: (addedCategory.rules as CategoryRules)?.color || newCategory.color,
        isDefault: false
      }

      setCategories([...categories, categoryForUI])
      setNewCategory({ name: '', color: '#3b82f6', isDefault: false })
      showMessage('success', 'Category added successfully')
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to add category';
      showMessage('error', message);
    }
  }

  const removeCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category?.isDefault) {
      showMessage('error', 'Cannot delete default categories')
      return
    }

    try {
      const response = await fetch(`/api/budget-categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove category')
      }

      setCategories(categories.filter(c => c.id !== categoryId))
      showMessage('success', 'Category removed successfully')
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Failed to remove category')
    }
  }

  const exportData = () => {
    // Simulate data export
    const data = {
      profile: profileData,
      settings: generalSettings,
      notifications,
      categories,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spendscope-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()

    showMessage('success', 'Data exported successfully')
  }

  const syncTransactions = async () => {
    setSyncingTransactions(true);
    try {
      const response = await fetch('/api/plaid/sync-transactions', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('success', `Synced ${result.processed} transactions successfully`);
      } else {
        showMessage('error', result.error || 'Failed to sync transactions');
      }
    } catch (error) {
      showMessage('error', 'Failed to sync transactions');
    } finally {
      setSyncingTransactions(false);
    }
  }

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => (
    <button
      onClick={() => router.push(`/dashboard/settings/${tab.id}`)}
      className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === tab.id
          ? 'bg-primary/10 text-primary border-r-2 border-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <tab.icon className="h-5 w-5" />
      <span>{tab.name}</span>
    </button>
  )

  const MessageAlert = () => {
    if (!message) return null

    return (
      <div className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-md shadow-lg ${
        message.type === 'success' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
      }`}>
        {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <span className="text-sm font-medium">{message.text}</span>
        <button onClick={() => setMessage(null)}>
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  const ThemeAndColorPicker = () => {
    const { theme, setTheme } = useTheme()

    const themeOptions = [
      { value: 'light', label: '🌞 Light', icon: Sun },
      { value: 'dark', label: '🌙 Dark', icon: Moon },
      { value: 'system', label: '💻 System', icon: SettingsIcon }
    ]

    return (
      <div className="space-y-4">
        {/* Theme Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Theme Mode</h4>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as Theme)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                    theme === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Color Scheme Selection */}
        <div>
          <h4 className="text-sm font-medium mb-3">Color Scheme</h4>
          <ColorSchemePicker />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MessageAlert />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and application settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <TabButton key={tab.id} tab={tab} />
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="apple-card">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">Profile Information</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Image
                      className="h-16 w-16 rounded-full"
                      src={session?.user?.image || '/default-avatar.png'}
                      alt="Profile"
                      width={64}
                      height={64}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Profile Photo</p>
                      <p className="text-sm text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      icon={<User className="w-4 h-4" />}
                      variant="filled"
                      placeholder="Enter your full name"
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      icon={<Mail className="w-4 h-4" />}
                      variant="filled"
                      placeholder="Enter your email"
                      disabled
                      helper="Email cannot be changed"
                    />

                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium text-foreground">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Timezone
                      </label>
                      <div className="relative">
                        <select
                          value={profileData.timezone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                          className="apple-input w-full px-4 py-3 text-sm appearance-none cursor-pointer pr-10"
                        >
                          {timezones.map(timezone => (
                            <option key={timezone} value={timezone}>{timezone}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveProfileSettings} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => {
                      const getNotificationInfo = (key: string) => {
                        switch (key) {
                          case 'budgetExceeded':
                            return {
                              title: 'Budget Exceeded',
                              description: 'Get notified when you exceed your budget limits',
                              icon: <AlertCircle className="w-5 h-5 text-destructive" />
                            }
                          case 'largeTransaction':
                            return {
                              title: 'Large Transaction',
                              description: 'Alert for transactions above your average spending',
                              icon: <CreditCard className="w-5 h-5 text-orange-500" />
                            }
                          case 'weeklyDigest':
                            return {
                              title: 'Weekly Digest',
                              description: 'Weekly summary of your spending patterns',
                              icon: <Mail className="w-5 h-5 text-primary" />
                            }
                          case 'monthlyReport':
                            return {
                              title: 'Monthly Report',
                              description: 'Monthly financial report and insights',
                              icon: <Bell className="w-5 h-5 text-emerald-500" />
                            }
                          case 'accountConnection':
                            return {
                              title: 'Account Connection',
                              description: 'Updates about connected bank accounts',
                              icon: <Shield className="w-5 h-5 text-purple-500" />
                            }
                          default:
                            return {
                              title: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                              description: '',
                              icon: <Bell className="w-5 h-5 text-muted-foreground" />
                            }
                        }
                      }

                      const info = getNotificationInfo(key)

                      return (
                        <div key={key} className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-border transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-muted rounded-lg">
                              {info.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {info.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {info.description}
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer group">
                            <span className="sr-only">
                              {info.title}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="sr-only peer"
                              aria-label={info.title}
                            />

                            {/* iOS-style toggle switch container */}
                            <div className={`
                              relative w-[51px] h-[31px] rounded-full transition-all duration-200 ease-in-out
                              ${value
                                ? 'bg-[#34C759]' // iOS green
                                : 'bg-[#E5E5EA] dark:bg-[#39393D]' // iOS light gray / dark gray
                              }
                              group-active:scale-95
                              peer-focus:ring-4 peer-focus:ring-blue-500/20 peer-focus:ring-offset-2 peer-focus:ring-offset-background
                            `}>

                              {/* iOS toggle knob */}
                              <div className={`
                                absolute top-[2px] w-[27px] h-[27px] rounded-full
                                bg-white transition-all duration-200 ease-in-out
                                shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)]
                                dark:shadow-[0_3px_8px_rgba(0,0,0,0.3),0_3px_1px_rgba(0,0,0,0.12)]
                                ${value
                                  ? 'left-[22px]' // ON position
                                  : 'left-[2px]'  // OFF position
                                }
                              `}>
                                {/* Inner shadow for depth */}
                                <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white to-gray-50/50" />
                              </div>

                              {/* Subtle inner shadow for the track */}
                              <div className="absolute inset-[1px] rounded-full shadow-inner shadow-black/[0.04] dark:shadow-black/[0.08]" />
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button onClick={saveNotificationSettings} disabled={loading} className="px-6">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Palette className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">Category Management</h2>
                </div>

                <div className="space-y-6">
                  {/* Add New Category */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
                    <div className="flex items-center space-x-2 mb-4">
                      <Palette className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-semibold text-primary">Add New Category</h3>
                    </div>
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">
                        <Input
                          label="Category Name"
                          placeholder="e.g., Groceries, Entertainment"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                          variant="default"
                          helper="Choose a descriptive name for your category"
                        />
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <label className="text-xs font-medium text-foreground">Color</label>
                        <div className="relative">
                          <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                            className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer hover:border-border transition-colors shadow-sm"
                          />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-background rounded-full border border-border flex items-center justify-center">
                            <Palette className="w-2.5 h-2.5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={addCategory}
                        disabled={!newCategory.name.trim()}
                        className="px-6 py-3"
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>

                  {/* Category List */}
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-foreground">{category.name}</span>
                          {category.isDefault && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Default</span>
                          )}
                        </div>
                        {!category.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeCategory(category.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <SettingsIcon className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">General Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-foreground">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Currency
                      </label>
                      <div className="relative">
                        <select
                          value={generalSettings.currency}
                          onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                          className="apple-input w-full px-4 py-3 text-sm appearance-none cursor-pointer pr-10"
                        >
                          {currencies.map(currency => (
                            <option key={currency.code} value={currency.code}>{currency.name}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center space-x-1">
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Display currency for amounts</span>
                      </p>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-foreground">
                        <Palette className="w-4 h-4 inline mr-2" />
                        Theme & Color Scheme
                      </label>
                      <div className="space-y-4">
                        <ThemeAndColorPicker />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 flex items-center space-x-1">
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Customize your visual experience</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button onClick={saveGeneralSettings} disabled={loading} className="px-6">
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Tab */}
            {activeTab === 'data' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                  <h2 className="text-lg font-medium text-foreground">Data & Privacy</h2>
                </div>

                <div className="space-y-6">
                  {/* Connected Accounts */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-foreground">Connected Bank Accounts</h3>
                      <p className="text-sm text-muted-foreground">Manage your connected financial accounts</p>
                    </div>

                    {(() => {
                      if (loadingAccounts) {
                        return (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                            <p className="text-sm text-muted-foreground mt-2">Loading accounts...</p>
                          </div>
                        );
                      } else if (bankAccounts.length > 0) {
                        return (
                          <div className="space-y-3">
                            {bankAccounts.map((account) => (
                              <div key={account.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{account.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {account.type} • Balance: ${parseFloat(account.balance).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => disconnectAccount(account.id, account.name)}
                                >
                                  Disconnect
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center py-4">
                            <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No bank accounts connected</p>
                            <p className="text-xs text-muted-foreground">Connect an account from the dashboard to manage it here</p>
                          </div>
                        );
                      }
                    })()}

                    {/* Manual Sync Button */}
                    {bankAccounts.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">Sync Transactions</h4>
                            <p className="text-xs text-muted-foreground">Manually sync transactions from your connected accounts</p>
                          </div>
                          <Button
                            onClick={syncTransactions}
                            disabled={syncingTransactions}
                            variant="outline"
                            size="sm"
                          >
                            {syncingTransactions ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                                Syncing...
                              </>
                            ) : (
                              'Sync Now'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Data Export */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Export Your Data</h3>
                        <p className="text-sm text-muted-foreground">Download a copy of all your data</p>
                      </div>
                      <Button onClick={exportData} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Data Import */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Import Data</h3>
                        <p className="text-sm text-muted-foreground">Import transactions from CSV or other formats</p>
                      </div>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-destructive">Delete Account</h3>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}