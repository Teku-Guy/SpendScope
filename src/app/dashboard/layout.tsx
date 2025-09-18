'use client'

import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { LayoutDashboard, CreditCard, TrendingUp, Settings, LogOut, PiggyBank } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) {
    redirect('/')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: true },
    { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard, current: false },
    { name: 'Budgets', href: '/dashboard/budgets', icon: PiggyBank, current: false },
    { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp, current: false },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">SpendScope</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-6 py-4">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold ${
                          item.current
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-6 w-6 shrink-0 ${
                            item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>

              {/* User info */}
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <Image
                    className="h-8 w-8 rounded-full bg-gray-50"
                    src={session.user?.image || '/default-avatar.png'}
                    alt="Profile"
                    width={32}
                    height={32}
                  />
                  <span className="sr-only">Your profile</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}