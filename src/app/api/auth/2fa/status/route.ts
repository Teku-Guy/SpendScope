// app/api/auth/2fa/status/route.ts - Get 2FA status and manage methods
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserTwoFactorStatus, removeTwoFactorMethod, generateNewBackupCodes } from '@/lib/two-factor'
import { getUserTrustedDevices } from '@/lib/device-trust'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [twoFactorStatus, trustedDevices] = await Promise.all([
      getUserTwoFactorStatus(session.user.id),
      getUserTrustedDevices(session.user.id),
    ])

    return NextResponse.json({
      success: true,
      twoFactor: twoFactorStatus,
      trustedDevices,
    })
  } catch (error) {
    console.error('Error getting 2FA status:', error)
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const method = searchParams.get('method')

    if (!method || !['totp', 'email', 'sms', 'passkey'].includes(method)) {
      return NextResponse.json({ error: 'Valid method required' }, { status: 400 })
    }

    await removeTwoFactorMethod(session.user.id, method as any)

    return NextResponse.json({
      success: true,
      message: `${method.toUpperCase()} 2FA disabled`,
    })
  } catch (error) {
    console.error('Error disabling 2FA method:', error)
    return NextResponse.json(
      { error: 'Failed to disable 2FA method' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'regenerateBackupCodes') {
      const newCodes = await generateNewBackupCodes(session.user.id)

      return NextResponse.json({
        success: true,
        backupCodes: newCodes,
        message: 'New backup codes generated',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in 2FA status action:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}