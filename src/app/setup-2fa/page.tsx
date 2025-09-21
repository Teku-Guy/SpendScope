'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ShieldCheckIcon, SmartphoneIcon, MailIcon } from 'lucide-react'

export default function Setup2FAPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If user doesn't have an active session, redirect to sign in
    if (!session) {
      router.push('/auth/signin')
    }
  }, [session, router])

  const setupTOTP = () => {
    router.push('/dashboard/security?setup=totp')
  }

  const setupEmail2FA = () => {
    router.push('/dashboard/security?setup=email')
  }

  const skipForNow = () => {
    // Allow user to skip 2FA setup for now
    router.push(callbackUrl)
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Set Up Two-Factor Authentication
            </h1>
            <p className="text-muted-foreground">
              Protect your financial data with an extra layer of security
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-foreground">Choose a method:</h3>

            <button
              onClick={setupTOTP}
              className="w-full flex items-center p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
            >
              <SmartphoneIcon className="h-6 w-6 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Authenticator App</div>
                <div className="text-sm text-muted-foreground">
                  Use Google Authenticator, Authy, or similar app
                </div>
              </div>
            </button>

            <button
              onClick={setupEmail2FA}
              className="w-full flex items-center p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
            >
              <MailIcon className="h-6 w-6 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Email Codes</div>
                <div className="text-sm text-muted-foreground">
                  Get verification codes sent to your email
                </div>
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              2FA helps protect your financial data from unauthorized access
            </p>

            <Button
              variant="outline"
              onClick={skipForNow}
              className="w-full"
              disabled={loading}
            >
              Skip for Now
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              You can set up 2FA later in your security settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}