'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  ShieldCheckIcon,
  SmartphoneIcon,
  MailIcon,
  KeyIcon,
  QrCodeIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon
} from 'lucide-react'

interface TwoFactorStatus {
  enabled: boolean
  methods: string[]
  backupCodesCount: number
  hasPhone: boolean
}

interface TOTPSetup {
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
}

interface TrustedDevice {
  id: string
  deviceName: string
  trusted: boolean
  trustLevel: string
  lastSeen: string
  ipAddress: string
}

export default function TwoFactorSetup() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TOTP Setup
  const [showTotpSetup, setShowTotpSetup] = useState(false)
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null)
  const [totpVerifyCode, setTotpVerifyCode] = useState('')
  const [setupLoading, setSetupLoading] = useState(false)

  // Email Setup
  const [showEmailSetup, setShowEmailSetup] = useState(false)
  const [emailVerifyCode, setEmailVerifyCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  // Backup Codes
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status')
      const data = await response.json()

      if (data.success) {
        setStatus(data.twoFactor)
        setTrustedDevices(data.trustedDevices)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to load 2FA status')
    } finally {
      setLoading(false)
    }
  }

  const setupTOTP = async () => {
    try {
      setSetupLoading(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/setup/totp', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setTotpSetup(data.setup)
        setShowTotpSetup(true)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to setup TOTP')
    } finally {
      setSetupLoading(false)
    }
  }

  const verifyTOTP = async () => {
    if (!totpSetup || !totpVerifyCode.trim()) return

    try {
      setSetupLoading(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/verify/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: totpVerifyCode,
          isSetup: true,
          secret: totpSetup.manualEntryKey,
          backupCodes: totpSetup.backupCodes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowTotpSetup(false)
        setBackupCodes(totpSetup.backupCodes)
        setShowBackupCodes(true)
        await fetchStatus()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to verify TOTP')
    } finally {
      setSetupLoading(false)
    }
  }

  const setupEmail = async () => {
    try {
      setSetupLoading(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/setup/email', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setEmailSent(true)
        setShowEmailSetup(true)
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to setup email 2FA')
    } finally {
      setSetupLoading(false)
    }
  }

  const verifyEmail = async () => {
    if (!emailVerifyCode.trim()) return

    try {
      setSetupLoading(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/verify/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: emailVerifyCode,
          isSetup: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowEmailSetup(false)
        await fetchStatus()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to verify email code')
    } finally {
      setSetupLoading(false)
    }
  }

  const disable2FA = async (method: string) => {
    if (!confirm(`Are you sure you want to disable ${method.toUpperCase()} 2FA?`)) {
      return
    }

    try {
      const response = await fetch(`/api/auth/2fa/status?method=${method}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchStatus()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to disable 2FA method')
    }
  }

  const generateNewBackupCodes = async () => {
    if (!confirm('This will invalidate your current backup codes. Continue?')) {
      return
    }

    try {
      const response = await fetch('/api/auth/2fa/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerateBackupCodes' }),
      })

      const data = await response.json()

      if (data.success) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
        setCopiedCodes(false)
        await fetchStatus()
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Failed to generate new backup codes')
    }
  }

  const copyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'))
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    } catch (error) {
      console.error('Failed to copy backup codes:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 2FA Status Overview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className={`h-6 w-6 ${status?.enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            <div>
              <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                {status?.enabled
                  ? `${status.methods.length} method${status.methods.length !== 1 ? 's' : ''} enabled`
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
          </div>
          <Badge variant={status?.enabled ? 'default' : 'outline'}>
            {status?.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>

        {status?.enabled && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.methods.length}</div>
              <div className="text-sm text-muted-foreground">Methods</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.backupCodesCount}</div>
              <div className="text-sm text-muted-foreground">Backup Codes</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-2xl font-bold text-primary">{trustedDevices.length}</div>
              <div className="text-sm text-muted-foreground">Trusted Devices</div>
            </div>
            <div className="text-center p-3 bg-accent/20 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">✓</div>
              <div className="text-sm text-muted-foreground">Protected</div>
            </div>
          </div>
        )}
      </div>

      {/* Available Methods */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Authentication Methods</h3>

        <div className="space-y-4">
          {/* TOTP/Authenticator */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <SmartphoneIcon className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Authenticator App</div>
                <div className="text-sm text-muted-foreground">
                  Google Authenticator, Authy, or similar apps
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status?.methods.includes('totp') ? (
                <>
                  <Badge variant="default">Enabled</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disable2FA('totp')}
                  >
                    Disable
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={setupTOTP}
                  disabled={setupLoading}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Enable
                </Button>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <MailIcon className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Email Code</div>
                <div className="text-sm text-muted-foreground">
                  Receive codes via email
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {status?.methods.includes('email') ? (
                <>
                  <Badge variant="default">Enabled</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disable2FA('email')}
                  >
                    Disable
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={setupEmail}
                  disabled={setupLoading}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Enable
                </Button>
              )}
            </div>
          </div>

          {/* Backup Codes */}
          {status?.enabled && (
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <KeyIcon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Backup Codes</div>
                  <div className="text-sm text-muted-foreground">
                    {status.backupCodesCount} codes remaining
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateNewBackupCodes}
              >
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Trusted Devices */}
      {trustedDevices.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Trusted Devices</h3>
          <div className="space-y-3">
            {trustedDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="font-medium">{device.deviceName}</div>
                  <div className="text-sm text-muted-foreground">
                    Last seen: {new Date(device.lastSeen).toLocaleDateString()} • {device.ipAddress}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={device.trusted ? 'default' : 'outline'}>
                    {device.trustLevel}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Implement device removal
                      console.log('Remove device:', device.id)
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOTP Setup Modal */}
      <Modal
        isOpen={showTotpSetup}
        onClose={() => setShowTotpSetup(false)}
        title="Setup Authenticator App"
        size="md"
      >
        {totpSetup && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Scan this QR code with your authenticator app
              </p>
              <div className="flex justify-center mb-4">
                {totpSetup.qrCodeUrl && totpSetup.qrCodeUrl.startsWith('data:image/') ? (
                  <img
                    src={totpSetup.qrCodeUrl}
                    alt="TOTP QR Code"
                    className="border rounded-lg"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  />
                ) : (
                  <div className="p-4 border rounded-lg text-center text-muted-foreground">
                    QR Code could not be generated
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Can&apos;t scan? Enter this key manually: <code className="bg-muted px-2 py-1 rounded text-xs">{totpSetup.manualEntryKey}</code>
              </p>
            </div>

            <Input
              label="Verification Code"
              placeholder="Enter 6-digit code"
              value={totpVerifyCode}
              onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-wider"
            />

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowTotpSetup(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={verifyTOTP}
                disabled={setupLoading || totpVerifyCode.length !== 6}
                className="flex-1"
              >
                {setupLoading ? 'Verifying...' : 'Enable TOTP'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Email Setup Modal */}
      <Modal
        isOpen={showEmailSetup}
        onClose={() => setShowEmailSetup(false)}
        title="Setup Email 2FA"
        size="md"
      >
        <div className="space-y-6">
          {emailSent ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                We&apos;ve sent a verification code to your email address.
              </p>

              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={emailVerifyCode}
                onChange={(e) => setEmailVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-wider"
              />

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailSetup(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={verifyEmail}
                  disabled={setupLoading || emailVerifyCode.length !== 6}
                  className="flex-1"
                >
                  {setupLoading ? 'Verifying...' : 'Enable Email 2FA'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              Setting up email 2FA...
            </p>
          )}
        </div>
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        isOpen={showBackupCodes}
        onClose={() => setShowBackupCodes(false)}
        title="Your Backup Codes"
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              <strong>Important:</strong> Save these backup codes in a safe place.
              Each code can only be used once and will allow you to access your account if you lose your primary 2FA method.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-background rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={copyBackupCodes}
              className="flex-1"
            >
              {copiedCodes ? (
                <CheckIcon className="h-4 w-4 mr-2" />
              ) : (
                <CopyIcon className="h-4 w-4 mr-2" />
              )}
              {copiedCodes ? 'Copied!' : 'Copy Codes'}
            </Button>
            <Button
              onClick={() => setShowBackupCodes(false)}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}