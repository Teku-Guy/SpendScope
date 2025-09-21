// app/api/auth/2fa/verify/email/route.ts - Email 2FA verification endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyEmailCode, enableEmailTwoFactor } from '@/lib/email-2fa'
import { extractDeviceInfo, trustDevice } from '@/lib/device-trust'

interface VerifyEmailRequest {
  code: string
  isSetup?: boolean
  trustDevice?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VerifyEmailRequest = await request.json()
    const { code, isSetup, trustDevice: shouldTrustDevice } = body

    if (!code) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    let verification
    let newSetup = false

    if (isSetup) {
      // Setting up email 2FA for the first time
      const success = await enableEmailTwoFactor(session.user.id, code)
      verification = { success, method: 'email' as const }
      newSetup = true
    } else {
      // Verifying existing email 2FA
      verification = await verifyEmailCode(session.user.id, code)
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
        isNewSetup: newSetup,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying email code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}