'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

interface CategorySettings {
  id?: string
  name: string
  color: string
  isDefault: boolean
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('profile')
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

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const saveProfileSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', 'Profile settings saved successfully')
    } catch (error) {
      showMessage('error', 'Failed to save profile settings')
    } finally {
      setLoading(false)
    }
  }

  const saveNotificationSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', 'Notification settings saved successfully')
    } catch (error) {
      showMessage('error', 'Failed to save notification settings')
    } finally {
      setLoading(false)
    }
  }

  const saveGeneralSettings = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      showMessage('success', 'General settings saved successfully')
    } catch (error) {
      showMessage('error', 'Failed to save general settings')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = () => {
    if (!newCategory.name.trim()) return

    const category: CategorySettings = {
      id: Date.now().toString(),
      ...newCategory
    }

    setCategories([...categories, category])
    setNewCategory({ name: '', color: '#3b82f6', isDefault: false })
    showMessage('success', 'Category added successfully')
  }

  const removeCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category?.isDefault) {
      showMessage('error', 'Cannot delete default categories')
      return
    }

    setCategories(categories.filter(c => c.id !== categoryId))
    showMessage('success', 'Category removed successfully')
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

  const TabButton = ({ tab }: { tab: typeof tabs[0] }) => (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={`flex items-center space-x-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === tab.id
          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
        message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
      }`}>
        {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        <span className="text-sm font-medium">{message.text}</span>
        <button onClick={() => setMessage(null)}>
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MessageAlert />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and application settings</p>
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
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <User className="h-6 w-6 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
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
                      <p className="text-sm font-medium text-gray-900">Profile Photo</p>
                      <p className="text-sm text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {timezones.map(timezone => (
                          <option key={timezone} value={timezone}>{timezone}</option>
                        ))}
                      </select>
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
                  <Bell className="h-6 w-6 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-sm text-gray-500">
                            {key === 'budgetExceeded' && 'Get notified when you exceed your budget limits'}
                            {key === 'largeTransaction' && 'Alert for transactions above your average spending'}
                            {key === 'weeklyDigest' && 'Weekly summary of your spending patterns'}
                            {key === 'monthlyReport' && 'Monthly financial report and insights'}
                            {key === 'accountConnection' && 'Updates about connected bank accounts'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveNotificationSettings} disabled={loading}>
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
                  <Palette className="h-6 w-6 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Category Management</h2>
                </div>

                <div className="space-y-6">
                  {/* Add New Category */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Add New Category</h3>
                    <div className="flex items-center space-x-3">
                      <Input
                        placeholder="Category name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1"
                      />
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <Button onClick={addCategory} disabled={!newCategory.name.trim()}>
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Category List */}
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          {category.isDefault && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Default</span>
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
                  <SettingsIcon className="h-6 w-6 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency.code} value={currency.code}>{currency.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                      <select
                        value={generalSettings.theme}
                        onChange={(e) => setGeneralSettings(prev => ({ ...prev, theme: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveGeneralSettings} disabled={loading}>
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
                  <Shield className="h-6 w-6 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Data & Privacy</h2>
                </div>

                <div className="space-y-6">
                  {/* Data Export */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Export Your Data</h3>
                        <p className="text-sm text-gray-500">Download a copy of all your data</p>
                      </div>
                      <Button onClick={exportData} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Data Import */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Import Data</h3>
                        <p className="text-sm text-gray-500">Import transactions from CSV or other formats</p>
                      </div>
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                        <p className="text-sm text-red-700">Permanently delete your account and all data</p>
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