import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle, Info } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  variant?: 'default' | 'filled';
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helper,
  options,
  variant = 'default',
  icon,
  className,
  id,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const baseSelectClasses = cn(
    // Apple-inspired base styling
    'relative block w-full text-sm font-medium',
    'transition-all duration-300 ease-out',
    'focus:outline-none focus:ring-0',
    'appearance-none cursor-pointer',
    // Apple's signature rounded corners and spacing
    'rounded-2xl border-0',
    // Premium backdrop blur effect
    'backdrop-blur-md',
    // Apple's depth and shadows
    'shadow-sm hover:shadow-md focus:shadow-lg',
    // Smooth scaling animation on focus
    'focus:scale-[1.02] focus:transition-transform focus:duration-200',

    // Default variant - clean white/background style
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

    // Disabled state with Apple's subtle approach
    'disabled:bg-muted/40 disabled:text-muted-foreground/60',
    'disabled:border-border/20 disabled:cursor-not-allowed',
    'disabled:shadow-none disabled:transform-none',

    // Icon and chevron spacing
    icon && 'pl-12',
    'pr-12', // Space for Apple-style chevron
    className
  );

  const labelClasses = cn(
    'block mb-3 text-sm font-medium transition-colors duration-300',
    'text-foreground',
    error && 'text-red-600'
  );

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label htmlFor={selectId} className={labelClasses}>
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

        {/* Select element */}
        <select
          id={selectId}
          className={baseSelectClasses}
          {...props}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="py-2 px-4 bg-background text-foreground"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Apple-style chevron indicator */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none z-10">
          <div className="text-muted-foreground/70 group-focus-within:text-blue-500 group-hover:text-muted-foreground transition-all duration-300">
            <ChevronDown className="w-5 h-5 group-focus-within:rotate-180 transition-transform duration-300" />
          </div>
        </div>

        {/* Apple-style focus ring overlay */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/20 ring-offset-2 ring-offset-background" />
        </div>

        {/* Apple-style subtle inner glow on hover */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent" />
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