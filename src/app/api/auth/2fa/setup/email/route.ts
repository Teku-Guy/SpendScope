// app/api/auth/2fa/setup/email/route.ts - Email 2FA setup endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmailVerificationCode } from '@/lib/email-2fa'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sendEmailVerificationCode(
      session.user.id,
      session.user.email,
      'setup'
    )

    return NextResponse.json({
      success: result.success,
      expiresAt: result.expiresAt,
      message: `Verification code sent to ${session.user.email}`,
    })
  } catch (error) {
    console.error('Error sending email setup code:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}