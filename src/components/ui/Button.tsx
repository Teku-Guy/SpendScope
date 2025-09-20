import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = cn(
    // Apple-inspired base styling
    'relative inline-flex items-center justify-center',
    'font-medium text-center whitespace-nowrap',
    'rounded-2xl border-0 cursor-pointer',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background',
    'active:scale-[0.97] active:transition-transform active:duration-75',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
    // Apple's signature subtle shadows and depth
    'shadow-sm hover:shadow-md active:shadow-sm',
    // Smooth backdrop blur effect
    'backdrop-blur-md'
  );

  const variantClasses = {
    default: cn(
      // Apple's signature blue gradient
      'bg-gradient-to-b from-blue-500 to-blue-600',
      'hover:from-blue-400 hover:to-blue-500',
      'active:from-blue-600 active:to-blue-700',
      'text-white font-semibold',
      'border border-blue-600/20',
      'shadow-blue-500/25 hover:shadow-blue-500/35',
      'focus:ring-blue-500/30'
    ),
    secondary: cn(
      // Apple's secondary gray style
      'bg-gradient-to-b from-gray-100 to-gray-200',
      'hover:from-gray-50 hover:to-gray-100',
      'active:from-gray-200 active:to-gray-300',
      'dark:from-gray-700 dark:to-gray-800',
      'dark:hover:from-gray-600 dark:hover:to-gray-700',
      'dark:active:from-gray-800 dark:active:to-gray-900',
      'text-foreground font-medium',
      'border border-border/50',
      'focus:ring-gray-500/30'
    ),
    outline: cn(
      // Apple's clean outline style
      'bg-background/80 backdrop-blur-xl',
      'hover:bg-accent/50 hover:backdrop-blur-xl',
      'active:bg-accent/70',
      'border border-border/60 hover:border-border',
      'text-foreground font-medium',
      'shadow-sm hover:shadow-md',
      'focus:ring-primary/30'
    ),
    ghost: cn(
      // Apple's subtle ghost style
      'bg-transparent hover:bg-accent/40',
      'active:bg-accent/60',
      'text-foreground font-medium',
      'shadow-none hover:shadow-sm',
      'focus:ring-accent/30'
    ),
    destructive: cn(
      // Apple's red destructive style
      'bg-gradient-to-b from-red-500 to-red-600',
      'hover:from-red-400 hover:to-red-500',
      'active:from-red-600 active:to-red-700',
      'text-white font-semibold',
      'border border-red-600/20',
      'shadow-red-500/25 hover:shadow-red-500/35',
      'focus:ring-red-500/30'
    )
  };

  const sizeClasses = {
    sm: cn(
      'px-4 py-2.5 text-sm min-h-[36px]',
      'rounded-xl' // Slightly smaller radius for small buttons
    ),
    default: cn(
      'px-6 py-3 text-sm min-h-[44px]', // Apple's minimum touch target
      'rounded-2xl'
    ),
    lg: cn(
      'px-8 py-4 text-base min-h-[52px]',
      'rounded-2xl'
    )
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Apple-style inner glow effect */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Subtle inner highlight for premium feel */}
      {(variant === 'default' || variant === 'destructive') && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      )}
    </button>
  );
};