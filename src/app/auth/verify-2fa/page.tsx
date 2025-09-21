'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ShieldCheckIcon, SmartphoneIcon, MailIcon, KeyIcon } from 'lucide-react'

interface TwoFactorStatus {
  enabled: boolean
  methods: string[]
  backupCodesCount: number
  hasPhone: boolean
}

export default function Verify2FAPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard'

  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)

  useEffect(() => {
    fetchTwoFactorStatus()
  }, [])

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status')
      const data = await response.json()

      if (data.success) {
        setTwoFactorStatus(data.twoFactor)
        // Auto-select first available method
        if (data.twoFactor.methods.length > 0) {
          setSelectedMethod(data.twoFactor.methods[0])
        }
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
      setError('Failed to load 2FA methods')
    }
  }

  const sendEmailCode = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/setup/email', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setEmailSent(true)
      } else {
        setError(data.error || 'Failed to send email code')
      }
    } catch (error) {
      setError('Failed to send email code')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const endpoint = selectedMethod === 'totp'
        ? '/api/auth/2fa/verify/totp'
        : '/api/auth/2fa/verify/email'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          trustDevice,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update session to mark 2FA as verified
        await update({
          twoFactorVerified: true,
          deviceFingerprint: 'trusted',
        })

        // Redirect to original page
        router.push(callbackUrl)
      } else {
        setError(data.error || 'Invalid verification code')
        setVerificationCode('')
      }
    } catch (error) {
      setError('Verification failed. Please try again.')
      setVerificationCode('')
    } finally {
      setLoading(false)
    }
  }

  const renderMethodSelection = () => {
    if (!twoFactorStatus?.methods.length) {
      return (
        <div className="text-center text-muted-foreground">
          <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>No 2FA methods enabled. Please contact support.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Choose a verification method:
        </p>

        <div className="grid gap-3">
          {twoFactorStatus.methods.includes('totp') && (
            <button
              onClick={() => setSelectedMethod('totp')}
              className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                selectedMethod === 'totp'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <SmartphoneIcon className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Authenticator App</div>
                <div className="text-sm text-muted-foreground">
                  Use Google Authenticator, Authy, or similar
                </div>
              </div>
            </button>
          )}

          {twoFactorStatus.methods.includes('email') && (
            <button
              onClick={() => setSelectedMethod('email')}
              className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                selectedMethod === 'email'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <MailIcon className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Email Code</div>
                <div className="text-sm text-muted-foreground">
                  Get a code sent to your email
                </div>
              </div>
            </button>
          )}

          {twoFactorStatus.backupCodesCount > 0 && (
            <button
              onClick={() => setSelectedMethod('backup')}
              className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                selectedMethod === 'backup'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <KeyIcon className="h-5 w-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-medium">Backup Code</div>
                <div className="text-sm text-muted-foreground">
                  Use one of your backup codes
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    )
  }

  const renderVerificationForm = () => {
    if (!selectedMethod) return null

    const isEmail = selectedMethod === 'email'
    const isBackup = selectedMethod === 'backup'

    return (
      <div className="space-y-6">
        {isEmail && !emailSent && (
          <div className="text-center">
            <Button
              onClick={sendEmailCode}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Email Code'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Click to receive a verification code via email
            </p>
          </div>
        )}

        {(selectedMethod === 'totp' || emailSent || isBackup) && (
          <>
            <div>
              <Input
                label={
                  isBackup
                    ? 'Backup Code'
                    : selectedMethod === 'totp'
                    ? 'Authenticator Code'
                    : 'Email Code'
                }
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\s/g, '').toUpperCase())}
                placeholder={
                  isBackup ? 'XXXXXXXX' : selectedMethod === 'totp' ? '123456' : '123456'
                }
                maxLength={isBackup ? 8 : 6}
                className="text-center text-lg tracking-wider"
                autoComplete="one-time-code"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {isBackup
                  ? 'Enter one of your 8-character backup codes'
                  : selectedMethod === 'totp'
                  ? 'Enter the 6-digit code from your authenticator app'
                  : 'Enter the 6-digit code sent to your email'
                }
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="trustDevice"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="trustDevice" className="text-sm text-foreground">
                Trust this device for 30 days
              </label>
            </div>

            <Button
              onClick={verifyCode}
              disabled={loading || !verificationCode.trim()}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            {isEmail && (
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false)
                  setVerificationCode('')
                }}
                className="w-full"
              >
                Send New Code
              </Button>
            )}
          </>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setSelectedMethod('')
            setVerificationCode('')
            setEmailSent(false)
            setError(null)
          }}
          className="w-full"
        >
          ← Back to Methods
        </Button>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Two-Factor Authentication
            </h1>
            <p className="text-muted-foreground">
              Please verify your identity to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!selectedMethod ? renderMethodSelection() : renderVerificationForm()}

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Having trouble? Contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}