// lib/plaid-secure.ts - Secure Plaid integration with encryption
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { encrypt, decrypt } from './encryption'
import { prisma } from './prisma'

// Secure Plaid configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Use sandbox for development
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.PLAID_SECRET!,
      'User-Agent': 'SpendScope/1.0.0',
    },
  },
})

export const plaidClient = new PlaidApi(configuration)

/**
 * Securely stores encrypted Plaid access token
 */
export async function storeUserPlaidTokens(
  userId: string,
  accessToken: string,
  itemId: string
): Promise<void> {
  try {
    // Encrypt sensitive data before storing
    const encryptedAccessToken = await encrypt(accessToken)
    const encryptedItemId = await encrypt(itemId)

    await prisma.user.update({
      where: { id: userId },
      data: {
        plaidAccessToken: encryptedAccessToken,
        plaidItemId: encryptedItemId,
      },
    })
  } catch (error) {
    console.error('Error storing Plaid tokens:', error)
    throw new Error('Failed to securely store Plaid tokens')
  }
}

/**
 * Retrieves and decrypts Plaid access token
 */
export async function getUserPlaidToken(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plaidAccessToken: true },
    })

    if (!user?.plaidAccessToken) {
      return null
    }

    // Decrypt the access token
    return await decrypt(user.plaidAccessToken)
  } catch (error) {
    console.error('Error retrieving Plaid token:', error)
    throw new Error('Failed to retrieve Plaid access token')
  }
}

/**
 * Retrieves and decrypts Plaid item ID
 */
export async function getUserPlaidItemId(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plaidItemId: true },
    })

    if (!user?.plaidItemId) {
      return null
    }

    // Decrypt the item ID
    return await decrypt(user.plaidItemId)
  } catch (error) {
    console.error('Error retrieving Plaid item ID:', error)
    throw new Error('Failed to retrieve Plaid item ID')
  }
}

/**
 * Securely removes Plaid tokens (for disconnect)
 */
export async function removeUserPlaidTokens(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plaidAccessToken: null,
        plaidItemId: null,
      },
    })
  } catch (error) {
    console.error('Error removing Plaid tokens:', error)
    throw new Error('Failed to remove Plaid tokens')
  }
}

/**
 * Securely encrypts bank account metadata
 */
export async function encryptBankAccountData(accountData: any): Promise<any> {
  try {
    const sensitiveFields = ['account_id', 'mask', 'balances']
    const encrypted = { ...accountData }

    // Encrypt sensitive fields
    if (encrypted.account_id) {
      encrypted.account_id = await encrypt(encrypted.account_id)
    }

    if (encrypted.mask) {
      encrypted.mask = await encrypt(encrypted.mask)
    }

    // Encrypt balance information
    if (encrypted.balances) {
      encrypted.balances = await encrypt(JSON.stringify(encrypted.balances))
    }

    return encrypted
  } catch (error) {
    console.error('Error encrypting bank account data:', error)
    throw new Error('Failed to encrypt bank account data')
  }
}

/**
 * Securely decrypts bank account metadata
 */
export async function decryptBankAccountData(encryptedData: any): Promise<any> {
  try {
    const decrypted = { ...encryptedData }

    // Decrypt sensitive fields
    if (decrypted.account_id) {
      try {
        decrypted.account_id = await decrypt(decrypted.account_id)
      } catch {
        // Handle legacy unencrypted data gracefully
      }
    }

    if (decrypted.mask) {
      try {
        decrypted.mask = await decrypt(decrypted.mask)
      } catch {
        // Handle legacy unencrypted data gracefully
      }
    }

    if (decrypted.balances) {
      try {
        const balanceStr = await decrypt(decrypted.balances)
        decrypted.balances = JSON.parse(balanceStr)
      } catch {
        // Handle legacy unencrypted data gracefully
      }
    }

    return decrypted
  } catch (error) {
    console.error('Error decrypting bank account data:', error)
    // Return original data if decryption fails (for backwards compatibility)
    return encryptedData
  }
}

/**
 * Secure wrapper for Plaid API calls with automatic token handling
 */
export class SecurePlaidService {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Get accounts with encrypted token handling
   */
  async getAccounts() {
    const accessToken = await getUserPlaidToken(this.userId)
    if (!accessToken) {
      throw new Error('No Plaid access token found')
    }

    const response = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    return response.data
  }

  /**
   * Get transactions with encrypted token handling
   */
  async getTransactions(startDate: string, endDate: string, options?: any) {
    const accessToken = await getUserPlaidToken(this.userId)
    if (!accessToken) {
      throw new Error('No Plaid access token found')
    }

    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count: 500,
        ...options,
      },
    })

    return response.data
  }

  /**
   * Get item information
   */
  async getItem() {
    const accessToken = await getUserPlaidToken(this.userId)
    if (!accessToken) {
      throw new Error('No Plaid access token found')
    }

    const response = await plaidClient.itemGet({
      access_token: accessToken,
    })

    return response.data
  }

  /**
   * Refresh accounts and sync new transactions
   */
  async refreshData() {
    const accessToken = await getUserPlaidToken(this.userId)
    if (!accessToken) {
      throw new Error('No Plaid access token found')
    }

    // Get updated accounts
    const accountsResponse = await this.getAccounts()

    // Update account balances in database
    for (const account of accountsResponse.accounts) {
      const encryptedMetadata = await encryptBankAccountData({
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        balances: account.balances,
        mask: account.mask,
      })

      await prisma.bankAccount.upsert({
        where: { plaidAccountId: account.account_id },
        update: {
          name: account.name,
          officialName: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype || '',
          balance: account.balances.current || 0,
          metadata: encryptedMetadata,
        },
        create: {
          userId: this.userId,
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype || '',
          balance: account.balances.current || 0,
          metadata: encryptedMetadata,
        },
      })
    }

    return accountsResponse
  }
}

/**
 * Validate Plaid environment setup
 */
export function validatePlaidConfig(): boolean {
  const requiredEnvVars = ['PLAID_CLIENT_ID', 'PLAID_SECRET', 'ENCRYPTION_KEY']

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`)
      return false
    }
  }

  return true
}

/**
 * Initialize Plaid service for user
 */
export function createSecurePlaidService(userId: string): SecurePlaidService {
  if (!validatePlaidConfig()) {
    throw new Error('Plaid configuration is invalid')
  }

  return new SecurePlaidService(userId)
}