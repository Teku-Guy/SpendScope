'use client'

import { useTheme, COLOR_SCHEMES, ColorScheme } from '@/contexts/ThemeContext'
import { Moon, Sun, Monitor, Palette } from 'lucide-react'
import { Button } from './Button'
import { useState } from 'react'

export function ThemeSwitcher() {
  const { theme, colorScheme, actualTheme, setTheme, setColorScheme, toggleTheme } = useTheme()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor
  }

  const CurrentThemeIcon = themeIcons[theme]

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-9 h-9 p-0 hover:bg-accent transition-all duration-200"
          title={`Current theme: ${theme} (${actualTheme})`}
        >
          <CurrentThemeIcon className="h-4 w-4" />
        </Button>

        {/* Color Scheme Picker */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-9 h-9 p-0 hover:bg-accent transition-all duration-200"
          title="Change color scheme"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </div>

      {/* Color Scheme Dropdown */}
      {showColorPicker && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-card border border-border rounded-lg shadow-medium z-50 min-w-[240px] animate-slide-in">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Theme</h4>
              <div className="grid grid-cols-3 gap-1">
                {(['light', 'dark', 'system'] as const).map((themeOption) => {
                  const IconComponent = themeIcons[themeOption]
                  return (
                    <button
                      key={themeOption}
                      onClick={() => {
                        setTheme(themeOption)
                      }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-md transition-all duration-200 ${
                        theme === themeOption
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="text-xs capitalize">{themeOption}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Color Scheme</h4>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(COLOR_SCHEMES) as [ColorScheme, (typeof COLOR_SCHEMES)[ColorScheme]][]).map(([key, scheme]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setColorScheme(key)
                      setShowColorPicker(false)
                    }}
                    className={`flex items-center gap-2 p-2 rounded-md text-left transition-all duration-200 ${
                      colorScheme === key
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ backgroundColor: scheme.colors[500] }}
                    />
                    <span className="text-sm">{scheme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showColorPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  )
}

export function MiniThemeSwitcher() {
  const { toggleTheme, theme, actualTheme } = useTheme()

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-9 h-9 p-0 hover:bg-accent transition-all duration-200"
      title={`Current theme: ${theme} (${actualTheme})`}
    >
      {getIcon()}
    </Button>
  )
}

export function ColorSchemePicker() {
  const { colorScheme, setColorScheme } = useTheme()

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(COLOR_SCHEMES) as [ColorScheme, (typeof COLOR_SCHEMES)[ColorScheme]][]).map(([key, scheme]) => (
          <button
            key={key}
            onClick={() => setColorScheme(key)}
            className={`flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 border ${
              colorScheme === key
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div
              className="w-5 h-5 rounded-full border border-border/50 shadow-sm"
              style={{ backgroundColor: scheme.colors[500] }}
            />
            <span className="text-sm font-medium">{scheme.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}