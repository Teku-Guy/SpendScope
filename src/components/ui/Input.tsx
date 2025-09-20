import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'floating';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  icon,
  variant = 'default',
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const baseInputClasses = cn(
    'transition-all duration-200 ease-out',
    'block w-full px-4 py-3 text-sm',
    'border rounded-xl backdrop-blur-sm',
    'placeholder:text-muted-foreground/60',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    // Default variant
    variant === 'default' && [
      'bg-background border-border/50',
      'hover:border-border shadow-sm hover:shadow-md',
      'focus:border-primary focus:ring-primary/20',
      error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
    ],
    // Filled variant
    variant === 'filled' && [
      'bg-muted/50 border-border/30',
      'hover:bg-muted/70 hover:border-border/50',
      'focus:bg-background focus:border-primary focus:ring-primary/20',
      error && 'bg-destructive/10 border-destructive/50 focus:border-destructive focus:ring-destructive/20'
    ],
    // Floating label variant
    variant === 'floating' && [
      'bg-background/50 border-border/50 pt-6 pb-2',
      'hover:border-border hover:bg-background/70',
      'focus:border-primary focus:ring-primary/20 focus:bg-background',
      error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
    ],
    // Disabled state
    'disabled:bg-muted/30 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:border-border/30',
    icon && 'pl-11',
    className
  );

  const labelClasses = cn(
    'text-sm font-medium transition-colors duration-200',
    variant === 'floating' ?
      'absolute left-4 top-2 text-xs text-muted-foreground pointer-events-none' :
      'block mb-2 text-foreground',
    error && variant !== 'floating' && 'text-destructive'
  );

  return (
    <div className="space-y-1">
      <div className={variant === 'floating' ? 'relative' : ''}>
        {label && variant !== 'floating' && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-muted-foreground text-sm">
                {icon}
              </div>
            </div>
          )}

          <input
            id={inputId}
            className={baseInputClasses}
            {...props}
          />

          {label && variant === 'floating' && (
            <label htmlFor={inputId} className={labelClasses}>
              {label}
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {helper && !error && (
        <p className="text-sm text-muted-foreground flex items-center space-x-1">
          <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{helper}</span>
        </p>
      )}
    </div>
  );
};