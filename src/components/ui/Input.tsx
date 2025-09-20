import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Info } from 'lucide-react';

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
    // Apple-inspired base styling
    'relative block w-full text-sm font-medium',
    'transition-all duration-300 ease-out',
    'placeholder:text-muted-foreground/60 placeholder:font-normal',
    'focus:outline-none focus:ring-0',
    // Apple's signature rounded corners and spacing
    'rounded-2xl border-0',
    // Premium backdrop blur effect
    'backdrop-blur-md',
    // Apple's depth and shadows
    'shadow-sm hover:shadow-md focus:shadow-lg',
    // Smooth scaling animation on focus
    'focus:scale-[1.02] focus:transition-transform focus:duration-200',

    // Default variant - clean white/background
    variant === 'default' && [
      'bg-background/90 hover:bg-background',
      'px-4 py-4 min-h-[52px]', // Apple's comfortable touch targets
      'border-2 border-border/30 hover:border-border/50',
      'focus:border-blue-500/60 focus:bg-background',
      'focus:ring-4 focus:ring-blue-500/10',
      error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
    ],

    // Filled variant - Apple's subtle filled style
    variant === 'filled' && [
      'bg-muted/60 hover:bg-muted/80 focus:bg-background/95',
      'px-4 py-4 min-h-[52px]',
      'border-2 border-transparent hover:border-border/30',
      'focus:border-blue-500/60',
      'focus:ring-4 focus:ring-blue-500/10',
      error && 'bg-red-50/80 border-red-500/40 focus:border-red-500 focus:ring-red-500/10'
    ],

    // Floating label variant - modern Apple style
    variant === 'floating' && [
      'bg-background/90 hover:bg-background',
      'pt-7 pb-3 px-4 min-h-[60px]',
      'border-2 border-border/30 hover:border-border/50',
      'focus:border-blue-500/60 focus:bg-background',
      'focus:ring-4 focus:ring-blue-500/10',
      error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500/10'
    ],

    // Disabled state with Apple's subtle approach
    'disabled:bg-muted/40 disabled:text-muted-foreground/60',
    'disabled:border-border/20 disabled:cursor-not-allowed',
    'disabled:shadow-none disabled:transform-none',

    // Icon spacing
    icon && 'pl-12',
    className
  );

  const labelClasses = cn(
    'text-sm font-medium transition-all duration-300',
    variant === 'floating' ? [
      'absolute left-4 pointer-events-none',
      'top-2 text-xs text-muted-foreground',
      'peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted-foreground/60',
      'peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600',
      error && 'peer-focus:text-red-600'
    ] : [
      'block mb-3 text-foreground',
      error && 'text-red-600'
    ]
  );

  return (
    <div className="space-y-2">
      <div className={variant === 'floating' ? 'relative' : ''}>
        {/* Standard label for non-floating variants */}
        {label && variant !== 'floating' && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
          </label>
        )}

        <div className="relative group">
          {/* Icon with Apple-style positioning */}
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <div className="text-muted-foreground/70 group-focus-within:text-blue-500 transition-colors duration-300">
                {icon}
              </div>
            </div>
          )}

          {/* Input field */}
          <input
            id={inputId}
            className={cn(baseInputClasses, variant === 'floating' && 'peer')}
            {...props}
          />

          {/* Floating label */}
          {label && variant === 'floating' && (
            <label htmlFor={inputId} className={labelClasses}>
              {label}
            </label>
          )}

          {/* Apple-style focus ring overlay */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/20 ring-offset-2 ring-offset-background" />
          </div>
        </div>
      </div>

      {/* Error message with Apple-style design */}
      {error && (
        <div className="flex items-start space-x-2 px-1">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {/* Helper text with Apple-style subtlety */}
      {helper && !error && (
        <div className="flex items-start space-x-2 px-1">
          <Info className="w-3.5 h-3.5 text-muted-foreground/70 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">{helper}</p>
        </div>
      )}
    </div>
  );
};