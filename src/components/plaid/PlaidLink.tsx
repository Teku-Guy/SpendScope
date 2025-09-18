'use client'

import { usePlaidLink } from 'react-plaid-link'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export default function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const tokenRequestedRef = useRef(false)

  useEffect(() => {
    const createLinkToken = async () => {
      if (tokenRequestedRef.current) return
      tokenRequestedRef.current = true

      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        })
        const data = await response.json()

        if (data.link_token) {
          setLinkToken(data.link_token)
        }
      } catch (error) {
        console.error('Error creating link token:', error)
        tokenRequestedRef.current = false
      }
    }

    if (session && !linkToken) {
      createLinkToken()
    }
  }, [session, linkToken])

  const handleSuccess = useCallback(async (public_token: string) => {
    setIsLoading(true)
    try {
      // Exchange public token for access token
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token }),
      })

      const data = await response.json()

      if (data.success) {
        // Sync transactions
        await fetch('/api/plaid/sync-transactions', {
          method: 'POST',
        })

        onSuccess?.()
      }
    } catch (error) {
      console.error('Error connecting bank:', error)
    }
    setIsLoading(false)
  }, [onSuccess])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token) => {
      void handleSuccess(public_token)
    },
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link error:', err)
      }
    },
  })

  if (!session) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Please sign in to connect your bank account</p>
      </div>
    )
  }

  if (!linkToken) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Preparing bank connection...</span>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={() => open()}
        disabled={!ready || isLoading}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
          ready && !isLoading
            ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Connecting...
          </>
        ) : (
          'Connect Bank Account'
        )}
      </button>
      <p className="mt-2 text-xs text-gray-500">
        Securely connect your bank account to start tracking expenses
      </p>
    </div>
  )
}