// lib/encryption.ts - Field-level encryption for sensitive data
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 16
const IV_LENGTH = 16
const TAG_LENGTH = 16
const KEY_LENGTH = 32

// Promisify scrypt for async/await usage
const scryptAsync = promisify(scrypt)

interface EncryptionResult {
  encrypted: string
  salt: string
  iv: string
  tag: string
}

interface DecryptionData {
  encrypted: string
  salt: string
  iv: string
  tag: string
}

/**
 * Derives a key from the master key and salt using scrypt
 */
async function deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer
}

/**
 * Gets the master encryption key from environment variables
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long')
  }
  return key
}

/**
 * Encrypts sensitive data using AES-256-GCM
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Invalid plaintext provided')
    }

    const masterKey = getMasterKey()
    const salt = randomBytes(SALT_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    const key = await deriveKey(masterKey, salt)

    const cipher = createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    const result: EncryptionResult = {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    }

    // Return base64 encoded JSON for storage
    return Buffer.from(JSON.stringify(result)).toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypts data encrypted with the encrypt function
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data provided')
    }

    const masterKey = getMasterKey()

    // Decode from base64
    const dataStr = Buffer.from(encryptedData, 'base64').toString('utf8')
    const data: DecryptionData = JSON.parse(dataStr)

    const { encrypted, salt, iv, tag } = data

    if (!encrypted || !salt || !iv || !tag) {
      throw new Error('Invalid encryption data format')
    }

    const saltBuffer = Buffer.from(salt, 'hex')
    const ivBuffer = Buffer.from(iv, 'hex')
    const tagBuffer = Buffer.from(tag, 'hex')
    const key = await deriveKey(masterKey, saltBuffer)

    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
    decipher.setAuthTag(tagBuffer)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypts an object by encrypting specific sensitive fields
 */
export async function encryptObject<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): Promise<T> {
  const result = { ...obj }

  for (const field of sensitiveFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = await encrypt(result[field] as string)
    }
  }

  return result
}

/**
 * Decrypts an object by decrypting specific encrypted fields
 */
export async function decryptObject<T extends Record<string, any>>(
  obj: T,
  encryptedFields: (keyof T)[]
): Promise<T> {
  const result = { ...obj }

  for (const field of encryptedFields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = await decrypt(result[field] as string)
      } catch (error) {
        console.warn(`Failed to decrypt field ${String(field)}:`, error)
        // Keep original value if decryption fails (might be unencrypted legacy data)
      }
    }
  }

  return result
}

/**
 * Validates that encryption is working properly
 */
export async function validateEncryption(): Promise<boolean> {
  try {
    const testData = 'test-encryption-data-' + Date.now()
    const encrypted = await encrypt(testData)
    const decrypted = await decrypt(encrypted)
    return testData === decrypted
  } catch (error) {
    console.error('Encryption validation failed:', error)
    return false
  }
}

/**
 * Generates a secure random encryption key for environment variable
 */
export function generateEncryptionKey(): string {
  return randomBytes(64).toString('hex')
}

/**
 * Hash sensitive data for comparison without storing plaintext
 */
export function hashSensitiveData(data: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(data).digest('hex')
}