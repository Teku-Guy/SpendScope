// app/api/auth/2fa/setup/sms/route.ts - SMS 2FA setup endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendSMSVerificationCode } from '@/lib/sms-2fa'

interface SetupSMSRequest {
  phoneNumber: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SetupSMSRequest = await request.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    const result = await sendSMSVerificationCode(
      session.user.id,
      phoneNumber,
      'setup'
    )

    return NextResponse.json({
      success: result.success,
      expiresAt: result.expiresAt,
      message: `Verification code sent to ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`,
    })
  } catch (error) {
    console.error('Error sending SMS setup code:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}