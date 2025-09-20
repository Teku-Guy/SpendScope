import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

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
    'transition-all duration-200 ease-out',
    'block w-full px-4 py-3 text-sm',
    'border rounded-xl backdrop-blur-sm',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'appearance-none cursor-pointer shadow-sm hover:shadow-md',
    // Default variant
    variant === 'default' && [
      'bg-background border-border/50',
      'hover:border-border',
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
    // Disabled state
    'disabled:bg-muted/30 disabled:text-muted-foreground disabled:cursor-not-allowed disabled:border-border/30 disabled:shadow-none',
    icon && 'pl-11',
    'pr-10', // Space for chevron
    className
  );

  const labelClasses = cn(
    'block mb-2 text-sm font-medium transition-colors duration-200',
    'text-foreground',
    error && 'text-destructive'
  );

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className={labelClasses}>
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

        <select
          id={selectId}
          className={baseSelectClasses}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom chevron */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
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