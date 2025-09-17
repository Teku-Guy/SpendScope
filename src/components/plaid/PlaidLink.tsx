// components/plaid/PlaidLink.tsx
'use client';

import { usePlaidLink } from 'react-plaid-link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface PlaidLinkProps {
  readonly onSuccess?: () => void;
}

export default function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const { data: session } = useSession();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get link token when component mounts
  useEffect(() => {
    const getLinkToken = async () => {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error('Error getting link token:', error);
      }
    };

    if (session) {
      getLinkToken();
    }
  }, [session]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      const exchangeToken = async () => {
        setIsLoading(true);
        try {
          // Exchange public token for access token
          const response = await fetch('/api/plaid/exchange-public-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ public_token }),
          });

          if (response.ok) {
            // Sync transactions
            await fetch('/api/plaid/sync-transactions', {
              method: 'POST',
            });

            onSuccess?.();
          }
        } catch (error) {
          console.error('Error connecting bank:', error);
        }
        setIsLoading(false);
      };
      void exchangeToken();
    },
    onExit: (err, metadata) => {
      if (err) {
        console.error('Plaid Link error:', err);
      }
    },
  });

  if (!session) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please sign in to connect your bank account</p>
      </div>
    );
  }

  if (!linkToken) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Preparing bank connection...</p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <button
        onClick={() => open()}
        disabled={!ready || isLoading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        {isLoading ? 'Connecting...' : 'Connect Bank Account'}
      </button>
      <p className="text-sm text-gray-500 mt-2">
        Securely connect your bank account to start tracking spending
      </p>
    </div>
  );
}