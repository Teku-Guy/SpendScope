// app/api/auth/2fa/verify/sms/route.ts - SMS 2FA verification endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifySMSCode, enableSMSTwoFactor, getUserPhoneNumber } from '@/lib/sms-2fa'
import { extractDeviceInfo, trustDevice } from '@/lib/device-trust'

interface VerifySMSRequest {
  code: string
  phoneNumber?: string
  isSetup?: boolean
  trustDevice?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: VerifySMSRequest = await request.json()
    const { code, phoneNumber, isSetup, trustDevice: shouldTrustDevice } = body

    if (!code) {
      return NextResponse.json({ error: 'Verification code required' }, { status: 400 })
    }

    let verification
    let newSetup = false

    if (isSetup && phoneNumber) {
      // Setting up SMS 2FA for the first time
      const success = await enableSMSTwoFactor(session.user.id, phoneNumber, code)
      verification = { success, method: 'sms' as const }
      newSetup = true
    } else {
      // Verifying existing SMS 2FA
      verification = await verifySMSCode(session.user.id, code)
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

      // Get masked phone number for response
      let maskedPhone: string | null = null
      if (!isSetup) {
        const userPhone = await getUserPhoneNumber(session.user.id)
        if (userPhone) {
          maskedPhone = userPhone.replace(/\d(?=\d{4})/g, '*')
        }
      }

      return NextResponse.json({
        success: true,
        method: verification.method,
        isNewSetup: newSetup,
        phoneNumber: maskedPhone,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying SMS code:', error)
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    )
  }
}