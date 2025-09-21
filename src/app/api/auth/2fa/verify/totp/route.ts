// app/api/auth/2fa/verify/totp/route.ts - TOTP verification endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyTOTP, enableTOTP, generateTOTPSetup } from '@/lib/two-factor'
import { extractDeviceInfo, trustDevice } from '@/lib/device-trust'

interface VerifyTOTPRequest {
  token: string
  isSetup?: boolean
  secret?: string
  backupCodes?: string[]
  trustDevice?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VerifyTOTPRequest = await request.json()
    const { token, isSetup, secret, backupCodes, trustDevice: shouldTrustDevice } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    let verification
    let newSetup = false

    if (isSetup && secret && backupCodes) {
      // Setting up TOTP for the first time
      const success = await enableTOTP(session.user.id, secret, token, backupCodes)
      verification = { success, method: 'totp' as const }
      newSetup = true
    } else {
      // Verifying existing TOTP
      verification = await verifyTOTP(session.user.id, token)
    }

    if (verification.success) {
      // Trust device if requested
      if (shouldTrustDevice) {
        try {
          const deviceInfo = extractDeviceInfo(request)
          await trustDevice(session.user.id, deviceInfo)
        } catch (error) {
          console.warn('Failed to trust device:', error)
        }
      }

      return NextResponse.json({
        success: true,
        method: verification.method,
        remainingBackupCodes: verification.remainingBackupCodes,
        isNewSetup: newSetup,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying TOTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify TOTP' },
      { status: 500 }
    )
  }
}