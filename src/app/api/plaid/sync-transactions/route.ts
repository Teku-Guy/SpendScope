// app/api/plaid/sync-transactions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plaidAccessToken: true },
    });

    if (!user?.plaidAccessToken) {
      return NextResponse.json(
        { error: 'No bank account connected' },
        { status: 400 }
      );
    }

    // Get transactions from last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: user.plaidAccessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    const transactions = transactionsResponse.data.transactions;
    let processedCount = 0;
    let errorCount = 0;

    // Store transactions in database
    for (const txn of transactions) {
      try {
        // Find the corresponding bank account
        const bankAccount = await prisma.bankAccount.findFirst({
          where: { plaidAccountId: txn.account_id },
        });

        if (bankAccount) {
          // Get transaction name (handle deprecated name field)
          const transactionName = txn.merchant_name || 
                                 txn.original_description || 
                                 'Unknown Transaction';
          
          // Properly type the metadata for Prisma JSON
          const metadata: Prisma.InputJsonValue = {
            transaction_id: txn.transaction_id,
            account_id: txn.account_id,
            amount: txn.amount,
            iso_currency_code: txn.iso_currency_code || null,
            unofficial_currency_code: txn.unofficial_currency_code || null,
            category: txn.category || [],
            category_id: txn.category_id || null,
            check_number: txn.check_number || null,
            date: txn.date,
            location: txn.location ? {
              address: txn.location.address || null,
              city: txn.location.city || null,
              region: txn.location.region || null,
              postal_code: txn.location.postal_code || null,
              country: txn.location.country || null,
              lat: txn.location.lat || null,
              lon: txn.location.lon || null,
              store_number: txn.location.store_number || null,
            } : null,
            merchant_name: txn.merchant_name || null,
            original_description: txn.original_description || null,
            pending: txn.pending,
            pending_transaction_id: txn.pending_transaction_id || null,
            account_owner: txn.account_owner || null,
            transaction_code: txn.transaction_code || null,
            transaction_type: txn.transaction_type || null,
          };

          await prisma.transaction.upsert({
            where: { plaidTransactionId: txn.transaction_id },
            update: {
              amount: Math.abs(txn.amount),
              date: new Date(txn.date),
              name: transactionName,
              merchantName: txn.merchant_name || null,
              category: txn.category?.[0] || 'Other',
              subcategory: txn.category?.[1] || null,
              plaidMetadata: metadata,
            },
            create: {
              userId: session.user.id,
              accountId: bankAccount.id,
              plaidTransactionId: txn.transaction_id,
              amount: Math.abs(txn.amount),
              date: new Date(txn.date),
              name: transactionName,
              merchantName: txn.merchant_name || null,
              category: txn.category?.[0] || 'Other',
              subcategory: txn.category?.[1] || null,
              plaidMetadata: metadata,
            },
          });
          
          processedCount++;
        }
      } catch (txnError) {
        console.error(`Error processing transaction ${txn.transaction_id}:`, txnError);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      transactions: transactions.length,
      processed: processedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync transactions', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}