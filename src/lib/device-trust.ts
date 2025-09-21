// lib/device-trust.ts - Device fingerprinting and trust management
import { UAParser } from 'ua-parser-js'
import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { prisma } from './prisma'
import { sendSecurityAlert } from './email-2fa'

export interface DeviceInfo {
  fingerprint: string
  name: string
  userAgent: string
  ipAddress: string
  browser?: string
  os?: string
  device?: string
}

export interface DeviceTrustStatus {
  trusted: boolean
  isNewDevice: boolean
  trustLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  deviceInfo: DeviceInfo
  requiresTwoFactor: boolean
}

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''

  // Parse user agent for more detailed info
  const parser = new UAParser(userAgent)
  const browserInfo = parser.getBrowser()
  const osInfo = parser.getOS()
  const deviceInfo = parser.getDevice()

  // Create fingerprint components
  const components = [
    browserInfo.name || 'unknown',
    browserInfo.version || 'unknown',
    osInfo.name || 'unknown',
    osInfo.version || 'unknown',
    deviceInfo.type || 'desktop',
    acceptLanguage.slice(0, 10), // First 10 chars to avoid too much specificity
    acceptEncoding,
  ]

  // Generate hash
  return createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 32) // Use first 32 chars
}

/**
 * Extract device information from request
 */
export function extractDeviceInfo(request: NextRequest): DeviceInfo {
  const userAgent = request.headers.get('user-agent') || ''
  const ipAddress = getClientIP(request)

  const parser = new UAParser(userAgent)
  const browserInfo = parser.getBrowser()
  const osInfo = parser.getOS()
  const deviceInfo = parser.getDevice()

  const fingerprint = generateDeviceFingerprint(request)

  // Generate human-readable device name
  const browserName = browserInfo.name || 'Unknown Browser'
  const osName = osInfo.name || 'Unknown OS'
  const deviceType = deviceInfo.type || 'Desktop'
  const deviceName = `${browserName} on ${osName} (${deviceType})`

  return {
    fingerprint,
    name: deviceName,
    userAgent,
    ipAddress,
    browser: browserInfo.name,
    os: osInfo.name,
    device: deviceInfo.type,
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to remote address
  return 'unknown'
}

/**
 * Check device trust status for user
 */
export async function checkDeviceTrust(
  userId: string,
  request: NextRequest
): Promise<DeviceTrustStatus> {
  try {
    const deviceInfo = extractDeviceInfo(request)

    // Check if device exists in trusted devices
    const trustedDevice = await prisma.trustedDevice.findUnique({
      where: {
        userId_deviceFingerprint: {
          userId,
          deviceFingerprint: deviceInfo.fingerprint,
        },
      },
    })

    // Get user's 2FA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorMethods: true,
      },
    })

    const has2FAEnabled = user?.twoFactorEnabled || false
    const isNewDevice = !trustedDevice

    if (trustedDevice && trustedDevice.trusted) {
      // Update last seen
      await prisma.trustedDevice.update({
        where: { id: trustedDevice.id },
        data: {
          lastSeen: new Date(),
          ipAddress: deviceInfo.ipAddress,
        },
      })

      return {
        trusted: true,
        isNewDevice: false,
        trustLevel: trustedDevice.trustLevel as 'LOW' | 'MEDIUM' | 'HIGH',
        deviceInfo,
        requiresTwoFactor: false,
      }
    }

    // New device or untrusted device
    let trustLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'

    // Analyze device characteristics for trust level
    if (deviceInfo.browser && deviceInfo.os) {
      trustLevel = 'MEDIUM'
    } else {
      trustLevel = 'LOW'
    }

    return {
      trusted: false,
      isNewDevice,
      trustLevel,
      deviceInfo,
      requiresTwoFactor: has2FAEnabled,
    }
  } catch (error) {
    console.error('Error checking device trust:', error)

    // Default to requiring 2FA on error
    return {
      trusted: false,
      isNewDevice: true,
      trustLevel: 'LOW',
      deviceInfo: extractDeviceInfo(request),
      requiresTwoFactor: true,
    }
  }
}

/**
 * Trust a device after successful 2FA verification
 */
export async function trustDevice(
  userId: string,
  deviceInfo: DeviceInfo,
  trustDuration?: number // Duration in days, default 30 days
): Promise<void> {
  try {
    const expiresAt = trustDuration
      ? new Date(Date.now() + trustDuration * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default

    await prisma.trustedDevice.upsert({
      where: {
        userId_deviceFingerprint: {
          userId,
          deviceFingerprint: deviceInfo.fingerprint,
        },
      },
      update: {
        trusted: true,
        trustLevel: 'MEDIUM',
        deviceName: deviceInfo.name,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        lastSeen: new Date(),
        trustedAt: new Date(),
        expiresAt,
      },
      create: {
        userId,
        deviceFingerprint: deviceInfo.fingerprint,
        deviceName: deviceInfo.name,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        trusted: true,
        trustLevel: 'MEDIUM',
        trustedAt: new Date(),
        expiresAt,
      },
    })

    // Send security notification for new device
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (user?.email) {
      await sendSecurityAlert(user.email, 'new_device', {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        timestamp: new Date(),
      })
    }
  } catch (error) {
    console.error('Error trusting device:', error)
    throw new Error('Failed to trust device')
  }
}

/**
 * Revoke trust for a specific device
 */
export async function revokeTrustForDevice(
  userId: string,
  deviceFingerprint: string
): Promise<void> {
  try {
    await prisma.trustedDevice.update({
      where: {
        userId_deviceFingerprint: {
          userId,
          deviceFingerprint,
        },
      },
      data: {
        trusted: false,
        trustLevel: 'LOW',
      },
    })
  } catch (error) {
    console.error('Error revoking device trust:', error)
    throw new Error('Failed to revoke device trust')
  }
}

/**
 * Get all trusted devices for user
 */
export async function getUserTrustedDevices(userId: string) {
  try {
    return await prisma.trustedDevice.findMany({
      where: { userId },
      select: {
        id: true,
        deviceFingerprint: true,
        deviceName: true,
        trusted: true,
        trustLevel: true,
        firstSeen: true,
        lastSeen: true,
        trustedAt: true,
        expiresAt: true,
        ipAddress: true,
      },
      orderBy: { lastSeen: 'desc' },
    })
  } catch (error) {
    console.error('Error getting trusted devices:', error)
    throw new Error('Failed to get trusted devices')
  }
}

/**
 * Remove all trusted devices for user
 */
export async function removeAllTrustedDevices(userId: string): Promise<void> {
  try {
    await prisma.trustedDevice.deleteMany({
      where: { userId },
    })
  } catch (error) {
    console.error('Error removing trusted devices:', error)
    throw new Error('Failed to remove trusted devices')
  }
}

/**
 * Clean up expired trusted devices
 */
export async function cleanupExpiredDevices(): Promise<void> {
  try {
    await prisma.trustedDevice.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  } catch (error) {
    console.error('Error cleaning up expired devices:', error)
  }
}

/**
 * Update device trust level based on usage patterns
 */
export async function updateDeviceTrustLevel(
  deviceId: string,
  newTrustLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): Promise<void> {
  try {
    await prisma.trustedDevice.update({
      where: { id: deviceId },
      data: { trustLevel: newTrustLevel },
    })
  } catch (error) {
    console.error('Error updating device trust level:', error)
    throw new Error('Failed to update device trust level')
  }
}

/**
 * Check if device trust is expired
 */
export function isDeviceTrustExpired(device: any): boolean {
  if (!device.expiresAt) return false
  return new Date() > new Date(device.expiresAt)
}

/**
 * Get device risk score (0-100, higher is riskier)
 */
export function calculateDeviceRiskScore(
  deviceInfo: DeviceInfo,
  isNewDevice: boolean,
  userHistory?: any
): number {
  let riskScore = 0

  // New device penalty
  if (isNewDevice) {
    riskScore += 30
  }

  // Unknown browser penalty
  if (!deviceInfo.browser || deviceInfo.browser === 'unknown') {
    riskScore += 20
  }

  // Unknown OS penalty
  if (!deviceInfo.os || deviceInfo.os === 'unknown') {
    riskScore += 15
  }

  // Mobile device slight penalty (more likely to be lost)
  if (deviceInfo.device === 'mobile') {
    riskScore += 10
  }

  // Cap at 100
  return Math.min(riskScore, 100)
}