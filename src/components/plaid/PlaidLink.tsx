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
        if (data.isExistingConnection) {
          alert('Bank account data refreshed successfully! All transactions have been updated.')
        } else {
          alert('Bank account connected successfully!')
        }

        // Sync transactions
        const syncResponse = await fetch('/api/plaid/sync-transactions', {
          method: 'POST',
        })

        const syncData = await syncResponse.json()

        if (!syncResponse.ok) {
          console.error('Transaction sync failed:', syncData)
          alert('Warning: Bank account connected but transaction sync failed. Please try refreshing manually.')
        }

        onSuccess?.()
      } else {
        console.error('Failed to connect bank account:', data.error)
        if (data.error?.includes('already connected')) {
          alert('This bank account is already connected to another user account.')
        } else {
          alert(data.error || 'Failed to connect bank account. Please try again.')
        }
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
    }
  })

  if (!session) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Please sign in to connect your bank account</p>
      </div>
    )
  }

  if (!linkToken) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Preparing bank connection...</span>
      </div>
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={() => open()}
        disabled={!ready || isLoading}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white transition-all duration-200 ${
          ready && !isLoading
            ? 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 shadow-sm hover:shadow-md'
            : 'bg-muted-foreground/50 cursor-not-allowed'
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
      <p className="mt-2 text-xs text-muted-foreground">
        Securely connect your bank account to start tracking expenses
      </p>
    </div>
  )
}