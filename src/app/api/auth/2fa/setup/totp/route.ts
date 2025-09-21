// app/api/auth/2fa/setup/totp/route.ts - TOTP setup endpoint
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTOTPSetup } from '@/lib/two-factor'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.email) {
      return NextResponse.json({ error: 'Email required for TOTP setup' }, { status: 400 })
    }

    const setup = await generateTOTPSetup(
      session.user.id,
      session.user.email,
      'SpendScope'
    )

    return NextResponse.json({
      success: true,
      setup: {
        qrCodeUrl: setup.qrCodeUrl,
        manualEntryKey: setup.manualEntryKey,
        backupCodes: setup.backupCodes,
      },
      // Don't send the raw secret to the client
    })
  } catch (error) {
    console.error('Error setting up TOTP:', error)
    return NextResponse.json(
      { error: 'Failed to setup TOTP' },
      { status: 500 }
    )
  }
}