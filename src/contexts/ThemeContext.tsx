'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ColorScheme = 'blue' | 'emerald' | 'purple' | 'rose' | 'amber' | 'slate'

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  setColorScheme: (scheme: ColorScheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const COLOR_SCHEMES = {
  blue: {
    name: 'Ocean Blue',
    primary: 'blue',
    colors: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    }
  },
  emerald: {
    name: 'Forest Green',
    primary: 'emerald',
    colors: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      900: '#064e3b'
    }
  },
  purple: {
    name: 'Royal Purple',
    primary: 'purple',
    colors: {
      50: '#faf5ff',
      100: '#f3e8ff',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      900: '#4c1d95'
    }
  },
  rose: {
    name: 'Warm Rose',
    primary: 'rose',
    colors: {
      50: '#fff1f2',
      100: '#ffe4e6',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be185d',
      900: '#881337'
    }
  },
  amber: {
    name: 'Golden Amber',
    primary: 'amber',
    colors: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      900: '#78350f'
    }
  },
  slate: {
    name: 'Modern Slate',
    primary: 'slate',
    colors: {
      50: '#f8fafc',
      100: '#f1f5f9',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      900: '#0f172a'
    }
  }
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColorScheme?: ColorScheme
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultColorScheme = 'blue'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('spendscope-theme') as Theme
    const savedColorScheme = localStorage.getItem('spendscope-color-scheme') as ColorScheme

    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setTheme(savedTheme)
    }

    if (savedColorScheme && Object.keys(COLOR_SCHEMES).includes(savedColorScheme)) {
      setColorScheme(savedColorScheme)
    }
  }, [])

  // Update actual theme based on theme setting and system preference
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        setActualTheme(systemTheme)
      } else {
        setActualTheme(theme as 'light' | 'dark')
      }
    }

    updateActualTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', updateActualTheme)

    return () => mediaQuery.removeEventListener('change', updateActualTheme)
  }, [theme])

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement

    // Remove all theme classes
    root.classList.remove('light', 'dark')
    Object.keys(COLOR_SCHEMES).forEach(scheme => {
      root.classList.remove(`theme-${scheme}`)
    })

    // Add current theme classes
    root.classList.add(actualTheme)
    root.classList.add(`theme-${colorScheme}`)

    // Save to localStorage
    localStorage.setItem('spendscope-theme', theme)
    localStorage.setItem('spendscope-color-scheme', colorScheme)
  }, [theme, colorScheme, actualTheme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const handleSetColorScheme = (newScheme: ColorScheme) => {
    setColorScheme(newScheme)
  }

  const toggleTheme = React.useCallback(() => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }, [theme])

  const value: ThemeContextType = React.useMemo(() => ({
    theme,
    colorScheme,
    actualTheme,
    setTheme: handleSetTheme,
    setColorScheme: handleSetColorScheme,
    toggleTheme
  }), [theme, colorScheme, actualTheme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { COLOR_SCHEMES }
export type { ThemeContextType }