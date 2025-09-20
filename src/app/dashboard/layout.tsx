'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect,usePathname } from 'next/navigation'
import Image from 'next/image'
import { LayoutDashboard, CreditCard, TrendingUp, Settings, LogOut, PiggyBank } from 'lucide-react'
import { MiniThemeSwitcher } from '@/components/ui/ThemeSwitcher'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

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
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border shadow-soft">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
            <h1 className="text-xl font-bold text-gradient">SpendScope</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isCurrent = pathname === item.href
                    return (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          className={`group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200 ${
                            isCurrent
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          <item.icon
                            className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                              isCurrent ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
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
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8">
          <div className="px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}