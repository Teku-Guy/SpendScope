// lib/sms-2fa.ts - SMS-based 2FA with Twilio
import { Twilio } from 'twilio'
import { randomInt } from 'crypto'
import { encrypt, decrypt } from './encryption'
import { prisma } from './prisma'
import { addTwoFactorMethod, TwoFactorVerification } from './two-factor'

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

interface SMSVerificationResult {
  success: boolean
  expiresAt: Date
}

/**
 * Send SMS verification code to user's phone
 */
export async function sendSMSVerificationCode(
  userId: string,
  phoneNumber: string,
  purpose: 'login' | 'setup' = 'login'
): Promise<SMSVerificationResult> {
  try {
    // Generate 6-digit code
    const code = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store encrypted code in database
    const encryptedCode = await encrypt(code)

    await prisma.twoFactorToken.create({
      data: {
        userId,
        type: 'SMS',
        token: encryptedCode,
        expiresAt,
        purpose,
      },
    })

    // Send SMS via Twilio
    const message = `Your SpendScope verification code is: ${code}. This code expires in 10 minutes.`

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    })

    return {
      success: true,
      expiresAt,
    }
  } catch (error) {
    console.error('Error sending SMS verification code:', error)
    throw new Error('Failed to send SMS verification code')
  }
}

/**
 * Verify SMS code
 */
export async function verifySMSCode(
  userId: string,
  code: string
): Promise<TwoFactorVerification> {
  try {
    // Find valid token
    const tokens = await prisma.twoFactorToken.findMany({
      where: {
        userId,
        type: 'SMS',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    for (const token of tokens) {
      try {
        const decryptedCode = await decrypt(token.token)

        if (decryptedCode === code) {
          // Delete used token
          await prisma.twoFactorToken.delete({
            where: { id: token.id },
          })

          return {
            success: true,
            method: 'sms',
          }
        }
      } catch (decryptError) {
        console.error('Error decrypting SMS token:', decryptError)
        continue
      }
    }

    return {
      success: false,
      method: 'sms',
    }
  } catch (error) {
    console.error('Error verifying SMS code:', error)
    throw new Error('Failed to verify SMS code')
  }
}

/**
 * Enable SMS 2FA for user
 */
export async function enableSMSTwoFactor(
  userId: string,
  phoneNumber: string,
  code: string
): Promise<boolean> {
  try {
    const verification = await verifySMSCode(userId, code)

    if (verification.success) {
      // Store encrypted phone number
      const encryptedPhone = await encrypt(phoneNumber)

      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: encryptedPhone,
        },
      })

      // Add SMS as 2FA method
      await addTwoFactorMethod(userId, 'sms')

      return true
    }

    return false
  } catch (error) {
    console.error('Error enabling SMS 2FA:', error)
    throw new Error('Failed to enable SMS 2FA')
  }
}

/**
 * Update user's phone number (requires verification)
 */
export async function updateUserPhone(
  userId: string,
  newPhoneNumber: string,
  verificationCode: string
): Promise<boolean> {
  try {
    const verification = await verifySMSCode(userId, verificationCode)

    if (verification.success) {
      const encryptedPhone = await encrypt(newPhoneNumber)

      await prisma.user.update({
        where: { id: userId },
        data: { phone: encryptedPhone },
      })

      return true
    }

    return false
  } catch (error) {
    console.error('Error updating phone number:', error)
    throw new Error('Failed to update phone number')
  }
}

/**
 * Get user's phone number (decrypted)
 */
export async function getUserPhoneNumber(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    })

    if (user?.phone) {
      return await decrypt(user.phone)
    }

    return null
  } catch (error) {
    console.error('Error getting user phone number:', error)
    return null
  }
}

/**
 * Format phone number for display (masks middle digits)
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ''

  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '')

  if (digits.length >= 10) {
    // US phone number format: (***) ***-**90
    const areaCode = digits.slice(-10, -7)
    const prefix = digits.slice(-7, -4)
    const lastTwo = digits.slice(-2)

    return `(${areaCode}) ${prefix}-**${lastTwo}`
  }

  // For shorter numbers, mask middle part
  if (digits.length > 4) {
    const start = digits.slice(0, 2)
    const end = digits.slice(-2)
    const middle = '*'.repeat(digits.length - 4)

    return `${start}${middle}${end}`
  }

  return phoneNumber
}