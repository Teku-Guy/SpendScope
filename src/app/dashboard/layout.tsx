'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect,usePathname } from 'next/navigation'
import Image from 'next/image'
import { LayoutDashboard, CreditCard, TrendingUp, Settings, LogOut, PiggyBank, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { MiniThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { ThemeAwareLogo, LogoIcon } from '@/components/ui/ThemeAwareLogo'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!session) {
    redirect('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
    { name: 'Budgets', href: '/dashboard/budgets', icon: PiggyBank },
    { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Enhanced mobile responsiveness */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-card border-r border-border shadow-soft transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
            {!sidebarCollapsed ? (
              <ThemeAwareLogo size="sm" />
            ) : (
              <LogoIcon size={24} />
            )}
            <div className="flex items-center gap-2">
              {/* Desktop collapse button */}
              <button
                className="hidden lg:flex p-1.5 rounded-md hover:bg-accent transition-colors duration-200"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {/* Mobile close button */}
              <button
                className="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex flex-1 flex-col py-4 ${sidebarCollapsed ? 'px-2' : 'px-6'}`}>
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = pathname === item.href
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex ${sidebarCollapsed ? 'justify-center px-2' : 'gap-x-3 px-3'} rounded-lg py-3 text-sm leading-6 font-medium transition-all duration-200 ${
                            isCurrent
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                          title={sidebarCollapsed ? item.name : ''}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                              isCurrent ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                            aria-hidden="true"
                          />
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* User info */}
              <li className="mt-auto">
                <div className="space-y-3">
                  {/* Theme Switcher */}
                  <div className="flex justify-center">
                    <MiniThemeSwitcher />
                  </div>

                  {/* User Profile */}
                  {sidebarCollapsed ? (
                    <div className="flex flex-col items-center gap-2">
                      <Image
                        className="h-8 w-8 rounded-full bg-muted"
                        src={session.user?.image || '/default-avatar.png'}
                        alt="Profile"
                        width={32}
                        height={32}
                        title={session.user?.name || ''}
                      />
                      <button
                        onClick={() => signOut()}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                        title="Sign out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-x-3 px-3 py-3 rounded-lg bg-accent/50 border border-border/50">
                      <Image
                        className="h-8 w-8 rounded-full bg-muted"
                        src={session.user?.image || '/default-avatar.png'}
                        alt="Profile"
                        width={32}
                        height={32}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors duration-200"
                        title="Sign out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-6 w-6" />
        </button>
        <ThemeAwareLogo size="sm" />
        <div className="ml-auto">
          <MiniThemeSwitcher />
        </div>
      </div>

      {/* Main content - Enhanced mobile spacing */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <main className="py-4 sm:py-6 lg:py-8">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}