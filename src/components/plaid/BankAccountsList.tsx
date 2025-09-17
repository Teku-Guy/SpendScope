// components/plaid/BankAccountsList.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export default function BankAccountsList() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log(accounts);

  useEffect(() => {
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

    if (session) {
      fetchAccounts();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No bank accounts connected yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <div key={account.id} className="bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">{account.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{account.type}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                ${Number(account.balance ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
