import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Apple-style backdrop with enhanced blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-400"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-lg" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-400"
              enterFrom="opacity-0 scale-90"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-300"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-90"
            >
              <Dialog.Panel
                className={cn(
                  // Apple-inspired modal design
                  'relative w-full transform overflow-hidden text-left align-middle',
                  'transition-all duration-400',

                  // Apple's signature rounded corners and materials
                  'rounded-3xl',
                  'bg-background/95 backdrop-blur-xl',
                  'border border-border/50',

                  // Apple's subtle shadows and depth
                  'shadow-2xl shadow-black/20',
                  'dark:shadow-black/40',

                  // Inner glow effect for premium feel
                  'ring-1 ring-white/20 dark:ring-white/10',

                  sizeClasses[size]
                )}
              >
                {/* Apple-style subtle gradient overlay */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                <div className="relative">
                  {/* Header with Apple-style close button */}
                  {title && (
                    <div className="flex items-center justify-between p-6 pb-4">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-semibold leading-7 text-foreground tracking-tight"
                      >
                        {title}
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        className={cn(
                          // Apple-style close button
                          'flex items-center justify-center',
                          'w-8 h-8 rounded-full',
                          'bg-muted/60 hover:bg-muted/80',
                          'text-muted-foreground hover:text-foreground',
                          'transition-all duration-200 ease-out',
                          'hover:scale-110 active:scale-95',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
                          'shadow-sm hover:shadow-md'
                        )}
                        aria-label="Close modal"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Content area with Apple-style padding */}
                  <div className={cn(
                    title ? 'px-6 pb-6' : 'p-6',
                    'space-y-4'
                  )}>
                    {children}
                  </div>
                </div>

                {/* Apple-style bottom border highlight */}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};