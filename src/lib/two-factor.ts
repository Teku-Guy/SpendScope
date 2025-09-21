// lib/two-factor.ts - Two-factor authentication utilities
import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'
import { randomBytes } from 'crypto'
import { encrypt, decrypt } from './encryption'
import { prisma } from './prisma'

export type TwoFactorMethod = 'totp' | 'email' | 'sms' | 'passkey'

interface TOTPSetup {
  secret: string
  qrCodeUrl: string
  manualEntryKey: string
  backupCodes: string[]
}

interface TwoFactorVerification {
  success: boolean
  method: TwoFactorMethod
  remainingBackupCodes?: number
}

/**
 * Generate TOTP secret and QR code for authenticator app setup
 */
export async function generateTOTPSetup(
  _userId: string, // Reserved for future use
  email: string,
  serviceName: string = 'SpendScope'
): Promise<TOTPSetup> {
  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${serviceName}:${email}`,
      issuer: serviceName,
      length: 32,
    })

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase()
    )

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    return {
      secret: secret.base32!,
      qrCodeUrl,
      manualEntryKey: secret.base32!,
      backupCodes,
    }
  } catch (error) {
    console.error('Error generating TOTP setup:', error)
    throw new Error('Failed to generate TOTP setup')
  }
}

/**
 * Enable TOTP 2FA for user
 */
export async function enableTOTP(
  userId: string,
  secret: string,
  token: string,
  backupCodes: string[]
): Promise<boolean> {
  try {
    // Verify the token first
    const isValid = speakeasy.totp.verify({
      secret,
      token,
      window: 2, // Allow some time drift
    })

    if (!isValid) {
      return false
    }

    // Encrypt secret and backup codes
    const encryptedSecret = await encrypt(secret)
    const encryptedBackupCodes = await Promise.all(
      backupCodes.map(code => encrypt(code))
    )

    // Update user with TOTP settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        backupCodes: encryptedBackupCodes,
        twoFactorEnabled: true,
        twoFactorMethods: {
          push: 'totp',
        },
        twoFactorVerifiedAt: new Date(),
      },
    })

    return true
  } catch (error) {
    console.error('Error enabling TOTP:', error)
    throw new Error('Failed to enable TOTP 2FA')
  }
}

/**
 * Verify TOTP token
 */
export async function verifyTOTP(
  userId: string,
  token: string
): Promise<TwoFactorVerification> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, backupCodes: true },
    })

    if (!user?.totpSecret) {
      throw new Error('TOTP not enabled for user')
    }

    // Decrypt secret
    const secret = await decrypt(user.totpSecret)

    // First try TOTP verification
    const isValidTOTP = speakeasy.totp.verify({
      secret,
      token,
      window: 2, // Allow some time drift
    })

    if (isValidTOTP) {
      return { success: true, method: 'totp' }
    }

    // Try backup codes if TOTP fails
    if (user.backupCodes && user.backupCodes.length > 0) {
      for (let i = 0; i < user.backupCodes.length; i++) {
        const backupCode = await decrypt(user.backupCodes[i])

        if (backupCode === token.toUpperCase()) {
          // Remove used backup code
          const updatedCodes = [...user.backupCodes]
          updatedCodes.splice(i, 1)

          await prisma.user.update({
            where: { id: userId },
            data: {
              backupCodes: updatedCodes,
            },
          })

          return {
            success: true,
            method: 'totp',
            remainingBackupCodes: updatedCodes.length,
          }
        }
      }
    }

    return { success: false, method: 'totp' }
  } catch (error) {
    console.error('Error verifying TOTP:', error)
    throw new Error('Failed to verify TOTP token')
  }
}

/**
 * Disable TOTP 2FA for user
 */
export async function disableTOTP(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorMethods: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Remove 'totp' from enabled methods
    const updatedMethods = user.twoFactorMethods.filter(method => method !== 'totp')

    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: null,
        backupCodes: [],
        twoFactorMethods: updatedMethods,
        twoFactorEnabled: updatedMethods.length > 0,
        twoFactorVerifiedAt: updatedMethods.length > 0 ? undefined : null,
      },
    })
  } catch (error) {
    console.error('Error disabling TOTP:', error)
    throw new Error('Failed to disable TOTP 2FA')
  }
}

/**
 * Generate new backup codes
 */
export async function generateNewBackupCodes(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    })

    if (!user?.totpSecret) {
      throw new Error('TOTP not enabled for user')
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex').toUpperCase()
    )

    // Encrypt backup codes
    const encryptedBackupCodes = await Promise.all(
      backupCodes.map(code => encrypt(code))
    )

    // Update user with new backup codes
    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: encryptedBackupCodes,
      },
    })

    return backupCodes
  } catch (error) {
    console.error('Error generating backup codes:', error)
    throw new Error('Failed to generate new backup codes')
  }
}

/**
 * Check if user has any 2FA methods enabled
 */
export async function getUserTwoFactorStatus(userId: string): Promise<{
  enabled: boolean
  methods: TwoFactorMethod[]
  backupCodesCount: number
  hasPhone: boolean
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorMethods: true,
        backupCodes: true,
        phone: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      enabled: user.twoFactorEnabled,
      methods: user.twoFactorMethods as TwoFactorMethod[],
      backupCodesCount: user.backupCodes.length,
      hasPhone: !!user.phone,
    }
  } catch (error) {
    console.error('Error getting 2FA status:', error)
    throw new Error('Failed to get 2FA status')
  }
}

/**
 * Add a 2FA method to user's enabled methods
 */
export async function addTwoFactorMethod(
  userId: string,
  method: TwoFactorMethod
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorMethods: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const methods = user.twoFactorMethods as TwoFactorMethod[]
    if (!methods.includes(method)) {
      methods.push(method)

      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorMethods: methods,
          twoFactorEnabled: true,
          twoFactorVerifiedAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Error adding 2FA method:', error)
    throw new Error('Failed to add 2FA method')
  }
}

/**
 * Remove a 2FA method from user's enabled methods
 */
export async function removeTwoFactorMethod(
  userId: string,
  method: TwoFactorMethod
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorMethods: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const methods = (user.twoFactorMethods as TwoFactorMethod[]).filter(m => m !== method)

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorMethods: methods,
        twoFactorEnabled: methods.length > 0,
        twoFactorVerifiedAt: methods.length > 0 ? undefined : null,
      },
    })
  } catch (error) {
    console.error('Error removing 2FA method:', error)
    throw new Error('Failed to remove 2FA method')
  }
}