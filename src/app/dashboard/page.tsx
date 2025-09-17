// app/dashboard/page.tsx - Dashboard with Plaid integration
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import LoginButton from '@/components/auth/LoginButton'
import PlaidLink from '@/components/plaid/PlaidLink'
import BankAccountsList from '@/components/plaid/BankAccountsList'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has connected bank accounts
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      bankAccounts: true,
    },
  })

  const hasConnectedBank = user?.plaidAccessToken && user.bankAccounts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold">SpendScope Dashboard</h1>
            <LoginButton />
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!hasConnectedBank ? (
            // Show bank connection if not connected
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Connect Your Bank Account
              </h2>
              <p className="text-gray-600 mb-6">
                To get started with SpendScope, connect your bank account to automatically track your spending and get AI-powered predictions.
              </p>
              <PlaidLink />
            </div>
          ) : (
            // Show dashboard if connected
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Connected Accounts
                </h2>
                <BankAccountsList />
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Spending Overview
                </h2>
                <div className="text-center py-8 text-gray-500">
                  Spending analytics coming soon...
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
