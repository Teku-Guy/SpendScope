// lib/email-2fa.ts - Email-based 2FA implementation
import nodemailer from 'nodemailer'
import { randomInt } from 'crypto'
import { encrypt, decrypt } from './encryption'
import { prisma } from './prisma'
import { addTwoFactorMethod, TwoFactorVerification } from './two-factor'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

/**
 * Get email configuration from environment
 */
function getEmailConfig(): EmailConfig {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  }

  if (!config.auth.user || !config.auth.pass) {
    throw new Error('SMTP credentials not configured')
  }

  return config
}

/**
 * Create nodemailer transporter
 */
function createTransporter() {
  const config = getEmailConfig()

  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: {
      rejectUnauthorized: false,
    },
  })
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
  return randomInt(100000, 999999).toString()
}

/**
 * Send email verification code
 */
export async function sendEmailVerificationCode(
  userId: string,
  email: string,
  purpose: 'login' | 'setup' = 'login'
): Promise<{ success: boolean; expiresAt: Date }> {
  try {
    // Generate verification code
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Encrypt the code
    const encryptedCode = await encrypt(code)

    // Store in database
    await prisma.twoFactorToken.create({
      data: {
        userId,
        token: encryptedCode,
        type: 'EMAIL',
        expiresAt,
        metadata: {
          email,
          purpose,
        },
      },
    })

    // Send email
    const transporter = createTransporter()

    const mailOptions = {
      from: `"SpendScope Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `SpendScope Verification Code - ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937; text-align: center;">SpendScope Security</h2>

          <div style="background: #f9fafb; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h1 style="color: #059669; margin: 0; font-size: 36px; letter-spacing: 8px;">${code}</h1>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            ${purpose === 'login'
              ? 'Use this code to complete your sign-in to SpendScope.'
              : 'Use this code to enable email 2FA for your SpendScope account.'}
          </p>

          <p style="color: #6b7280; font-size: 14px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>

          <div style="border-top: 1px solid #e5e7eb; margin: 30px 0; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              SpendScope - Secure Financial Tracking
            </p>
          </div>
        </div>
      `,
      text: `
        SpendScope Verification Code: ${code}

        ${purpose === 'login'
          ? 'Use this code to complete your sign-in to SpendScope.'
          : 'Use this code to enable email 2FA for your SpendScope account.'}

        This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

        SpendScope - Secure Financial Tracking
      `,
    }

    await transporter.sendMail(mailOptions)

    return { success: true, expiresAt }
  } catch (error) {
    console.error('Error sending email verification code:', error)
    throw new Error('Failed to send verification code')
  }
}

/**
 * Verify email 2FA code
 */
export async function verifyEmailCode(
  userId: string,
  code: string
): Promise<TwoFactorVerification> {
  try {
    // Find active tokens for user
    const tokens = await prisma.twoFactorToken.findMany({
      where: {
        userId,
        type: 'EMAIL',
        expiresAt: {
          gte: new Date(),
        },
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    for (const token of tokens) {
      try {
        const decryptedCode = await decrypt(token.token)

        if (decryptedCode === code) {
          // Mark token as used
          await prisma.twoFactorToken.update({
            where: { id: token.id },
            data: {
              usedAt: new Date(),
            },
          })

          // Clean up expired tokens
          await cleanupExpiredTokens(userId)

          return { success: true, method: 'email' }
        }
      } catch (decryptError) {
        console.warn('Failed to decrypt token:', decryptError)
        continue
      }
    }

    return { success: false, method: 'email' }
  } catch (error) {
    console.error('Error verifying email code:', error)
    throw new Error('Failed to verify email code')
  }
}

/**
 * Enable email 2FA for user
 */
export async function enableEmailTwoFactor(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const verification = await verifyEmailCode(userId, code)

    if (verification.success) {
      await addTwoFactorMethod(userId, 'email')
      return true
    }

    return false
  } catch (error) {
    console.error('Error enabling email 2FA:', error)
    throw new Error('Failed to enable email 2FA')
  }
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(userId?: string): Promise<void> {
  try {
    const whereClause: any = {
      expiresAt: {
        lt: new Date(),
      },
    }

    if (userId) {
      whereClause.userId = userId
    }

    await prisma.twoFactorToken.deleteMany({
      where: whereClause,
    })
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error)
  }
}

/**
 * Send security alert email
 */
export async function sendSecurityAlert(
  email: string,
  alertType: 'login' | 'new_device' | 'password_change' | '2fa_disabled',
  details: {
    userAgent?: string
    ipAddress?: string
    location?: string
    timestamp?: Date
  } = {}
): Promise<void> {
  try {
    const transporter = createTransporter()

    const alertMessages = {
      login: 'New sign-in to your SpendScope account',
      new_device: 'New device signed in to your SpendScope account',
      password_change: 'Password changed for your SpendScope account',
      '2fa_disabled': 'Two-factor authentication disabled',
    }

    const mailOptions = {
      from: `"SpendScope Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `SpendScope Security Alert - ${alertMessages[alertType]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626; text-align: center;">🔒 SpendScope Security Alert</h2>

          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">${alertMessages[alertType]}</h3>

            ${details.timestamp ? `<p><strong>When:</strong> ${details.timestamp.toLocaleString()}</p>` : ''}
            ${details.ipAddress ? `<p><strong>IP Address:</strong> ${details.ipAddress}</p>` : ''}
            ${details.userAgent ? `<p><strong>Device:</strong> ${details.userAgent}</p>` : ''}
            ${details.location ? `<p><strong>Location:</strong> ${details.location}</p>` : ''}
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            If this was you, no action is needed. If you don't recognize this activity, please:
          </p>

          <ul style="color: #374151; font-size: 16px; line-height: 1.5;">
            <li>Change your password immediately</li>
            <li>Enable two-factor authentication if not already enabled</li>
            <li>Review your account activity</li>
            <li>Contact support if you need assistance</li>
          </ul>

          <div style="border-top: 1px solid #e5e7eb; margin: 30px 0; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              SpendScope - Secure Financial Tracking
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending security alert:', error)
    // Don't throw error for security alerts to avoid blocking main flow
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    console.error('Email configuration test failed:', error)
    return false
  }
}