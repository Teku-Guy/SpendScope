'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface ThemeAwareLogoProps {
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
  readonly showText?: boolean
  readonly className?: string
}

export function ThemeAwareLogo({
  size = 'md',
  showText = true,
  className
}: ThemeAwareLogoProps) {
  const { actualTheme, colorScheme } = useTheme()

  // Size configurations
  const sizeConfig = {
    sm: { width: 130, height: 30, iconSize: 22, fontSize: 14, taglineSize: 6 },
    md: { width: 180, height: 42, iconSize: 32, fontSize: 18, taglineSize: 7 },
    lg: { width: 260, height: 60, iconSize: 44, fontSize: 22, taglineSize: 8 },
    xl: { width: 320, height: 75, iconSize: 55, fontSize: 28, taglineSize: 9 }
  }

  const config = sizeConfig[size]

  // Get base colors
  const getBaseColors = () => {
    const isDark = actualTheme === 'dark'
    return {
      iconBg: isDark ? '#1f2937' : '#f8fafc',
      iconBorder: isDark ? '#374151' : '#e2e8f0',
      textPrimary: isDark ? '#f9fafb' : '#1a1a1a',
      textSecondary: isDark ? '#9ca3af' : '#64748b',
      iconPrimary: '#ffffff',
      iconSecondary: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.8)'
    }
  }

  // Get accent color based on theme and color scheme
  const getAccentColor = () => {
    const isDark = actualTheme === 'dark'
    const accentMap = {
      blue: isDark ? '#3b82f6' : '#2563eb',
      emerald: isDark ? '#10b981' : '#059669',
      purple: isDark ? '#8b5cf6' : '#7c3aed',
      rose: isDark ? '#f43f5e' : '#e11d48',
      amber: isDark ? '#f59e0b' : '#d97706',
      slate: isDark ? '#64748b' : '#475569'
    }
    return accentMap[colorScheme]
  }

  const baseColors = getBaseColors()
  const accentColor = getAccentColor()

  return (
    <svg
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={cn('transition-all duration-300', className)}
      aria-label="SpendScope Logo"
    >
      {/* App Icon Container */}
      <g transform={`translate(${config.height * 0.13}, ${config.height * 0.13})`}>
        <rect
          x="0"
          y="0"
          width={config.iconSize}
          height={config.iconSize}
          rx={config.iconSize * 0.23}
          fill={accentColor}
          stroke={baseColors.iconBorder}
          strokeWidth="1"
        />

        {/* Icon Content */}
        <g transform={`translate(${config.iconSize / 2}, ${config.iconSize / 2})`}>
          {/* Outer organizing ring */}
          <circle
            cx="0"
            cy="0"
            r={config.iconSize * 0.27}
            fill="none"
            stroke={baseColors.iconSecondary}
            strokeWidth="1.5"
          />

          {/* Progress/budget ring */}
          <circle
            cx="0"
            cy="0"
            r={config.iconSize * 0.18}
            fill="none"
            stroke={baseColors.iconPrimary}
            strokeWidth="2.5"
            strokeDasharray={`${config.iconSize * 0.35} ${config.iconSize * 0.14}`}
            strokeLinecap="round"
            transform="rotate(-90)"
          />

          {/* Center element */}
          <circle
            cx="0"
            cy="0"
            r={config.iconSize * 0.07}
            fill={baseColors.iconPrimary}
          />
        </g>
      </g>

      {/* Typography */}
      {showText && (
        <g transform={`translate(${config.height * 1.17}, ${config.height * 0.3})`}>
          {/* Main text */}
          <text
            x="0"
            y={config.fontSize * 1.2}
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
            fontSize={config.fontSize}
            fontWeight="600"
            fill={baseColors.textPrimary}
            letterSpacing="-0.02em"
          >
            SpendScope
          </text>

          {/* Tagline with uppercase styling */}
          <text
            x="0"
            y={config.fontSize * 2.1}
            fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif"
            fontSize={config.taglineSize}
            fontWeight="400"
            fill={baseColors.textSecondary}
            letterSpacing="0.03em"
            style={{ textTransform: 'uppercase' }}
          >
            INTELLIGENT SPENDING INSIGHTS
          </text>
        </g>
      )}
    </svg>
  )
}

export function LogoIcon({
  size = 32,
  className
}: {
  readonly size?: number;
  readonly className?: string
}) {
  const { actualTheme, colorScheme } = useTheme()

  const getAccentColor = () => {
    const isDark = actualTheme === 'dark'
    const accentColors = {
      blue: isDark ? '#3b82f6' : '#2563eb',
      emerald: isDark ? '#10b981' : '#059669',
      purple: isDark ? '#8b5cf6' : '#7c3aed',
      rose: isDark ? '#f43f5e' : '#e11d48',
      amber: isDark ? '#f59e0b' : '#d97706',
      slate: isDark ? '#64748b' : '#475569'
    }
    return accentColors[colorScheme]
  }

  const accentColor = getAccentColor()
  const iconPrimary = '#ffffff'
  const iconSecondary = 'rgba(255,255,255,0.7)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('transition-all duration-300', className)}
      aria-label="SpendScope Icon"
    >
      <rect
        x="0"
        y="0"
        width="44"
        height="44"
        rx="10"
        fill={accentColor}
      />

      <g transform="translate(22, 22)">
        <circle
          cx="0"
          cy="0"
          r="12"
          fill="none"
          stroke={iconSecondary}
          strokeWidth="1.5"
        />

        <circle
          cx="0"
          cy="0"
          r="8"
          fill="none"
          stroke={iconPrimary}
          strokeWidth="2.5"
          strokeDasharray="15.7 6.3"
          strokeLinecap="round"
          transform="rotate(-90)"
        />

        <circle
          cx="0"
          cy="0"
          r="3"
          fill={iconPrimary}
        />
      </g>
    </svg>
  )
}