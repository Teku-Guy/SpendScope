// components/plaid/BankAccountsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  officialName?: string;
  subtype?: string;
  plaidAccountId: string;
}

export default function BankAccountsList() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [disconnectingAccount, setDisconnectingAccount] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchAccounts();
    }
  }, [session]);

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to disconnect "${accountName}"? This will permanently delete all transaction data for this account.`)) {
      return;
    }

    setDisconnectingAccount(accountId);
    try {
      const response = await fetch('/api/accounts/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(accounts.filter(acc => acc.id !== accountId));
        alert(data.message || 'Account disconnected successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to disconnect account');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      alert('Failed to disconnect account');
    } finally {
      setDisconnectingAccount(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/plaid/sync-transactions', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchAccounts(); // Refresh the accounts list
        alert('Data refreshed successfully');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to refresh data');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={`loading-account-${i}`} className="animate-pulse bg-muted h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No bank accounts connected yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {accounts.map((account) => (
        <div key={account.id} className="card-modern p-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{account.name}</h3>
                  {account.officialName && account.officialName !== account.name && (
                    <p className="text-sm text-muted-foreground">{account.officialName}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-muted-foreground capitalize">{account.type}</span>
                    {account.subtype && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground capitalize">{account.subtype}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    ${Number(account.balance ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="flex justify-end mt-3 pt-3 border-t border-border">
            <Button
              onClick={() => handleDisconnect(account.id, account.name)}
              disabled={disconnectingAccount === account.id}
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {disconnectingAccount === account.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        </div>
      ))}

      {/* Warning Note */}
      <div className="card-modern p-4 bg-amber-500/10 border-amber-500/20">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-foreground">Important</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Disconnecting a bank account will permanently delete all associated transaction data.
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
