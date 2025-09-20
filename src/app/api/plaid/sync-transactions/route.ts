// app/api/plaid/sync-transactions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST() {
  try {
    console.log('=== TRANSACTION SYNC STARTED ===');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User session found:', session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plaidAccessToken: true },
    });

    if (!user?.plaidAccessToken) {
      console.log('❌ No plaidAccessToken found for user');
      return NextResponse.json({ error: 'No bank account connected' }, { status: 400 });
    }

    console.log('✅ PlaidAccessToken found, starting sync...');

    // Ensure accounts table is populated/matches latest accounts
    const accountsResp = await plaidClient.accountsGet({ access_token: user.plaidAccessToken });
    for (const acct of accountsResp.data.accounts) {
      const accountMetadata: Prisma.InputJsonValue = {
        account_id: acct.account_id,
        name: acct.name,
        official_name: acct.official_name ?? null,
        type: acct.type,
        subtype: acct.subtype ?? null,
        balances: {
          available: acct.balances.available ?? null,
          current: acct.balances.current ?? null,
          limit: acct.balances.limit ?? null,
          iso_currency_code: acct.balances.iso_currency_code ?? null,
          unofficial_currency_code: acct.balances.unofficial_currency_code ?? null,
        },
        mask: acct.mask ?? null,
        persistent_account_id: acct.persistent_account_id ?? null,
      };

      await prisma.bankAccount.upsert({
        where: { plaidAccountId: acct.account_id },
        update: {
          name: acct.name,
          officialName: acct.official_name ?? acct.name,
          type: acct.type,
          subtype: acct.subtype ?? '',
          balance: acct.balances.current ?? 0,
          metadata: accountMetadata,
        },
        create: {
          userId: session.user.id,
          plaidAccountId: acct.account_id,
          name: acct.name,
          officialName: acct.official_name ?? acct.name,
          type: acct.type,
          subtype: acct.subtype ?? '',
          balance: acct.balances.current ?? 0,
          metadata: accountMetadata,
        },
      });
    }

    // Date window
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // --- KEY FIX: paginate until total_transactions fetched ---
    const all: any[] = [];
    const count = 100;
    let offset = 0;
    let total = 0;

    console.log(`📅 Fetching transactions from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    while (true) {
      console.log(`📤 Fetching batch: offset=${offset}, count=${count}`);
      const resp = await plaidClient.transactionsGet({
        access_token: user.plaidAccessToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        options: { count, offset },
      });

      const { transactions, total_transactions } = resp.data;
      if (total === 0) total = total_transactions;
      console.log(`📥 Received ${transactions.length} transactions, total available: ${total_transactions}`);
      all.push(...transactions);
      offset += transactions.length;

      if (all.length >= total) break;
      // Optional: small yield between pages if you want
      // await new Promise(r => setTimeout(r, 50));
    }

    console.log(`📊 Total transactions fetched: ${all.length}`);

    let processedCount = 0;
    let errorCount = 0;

    for (const txn of all) {
      try {
        // Safer: tie account to THIS user
        const bankAccount = await prisma.bankAccount.findFirst({
          where: { plaidAccountId: txn.account_id, userId: session.user.id },
          select: { id: true },
        });
        if (!bankAccount) continue;

        const transactionName =
          txn.merchant_name || txn.original_description || 'Unknown Transaction';

        const metadata: Prisma.InputJsonValue = {
          transaction_id: txn.transaction_id,
          account_id: txn.account_id,
          amount: txn.amount,
          iso_currency_code: txn.iso_currency_code ?? null,
          unofficial_currency_code: txn.unofficial_currency_code ?? null,
          category: txn.category ?? [],
          category_id: txn.category_id ?? null,
          check_number: txn.check_number ?? null,
          date: txn.date,
          location: txn.location ?? null,
          merchant_name: txn.merchant_name ?? null,
          original_description: txn.original_description ?? null,
          pending: txn.pending,
          pending_transaction_id: txn.pending_transaction_id ?? null,
          account_owner: txn.account_owner ?? null,
          transaction_code: txn.transaction_code ?? null,
          transaction_type: txn.transaction_type ?? null,
          personal_finance_category: (txn as any).personal_finance_category ?? null,
        };

        await prisma.transaction.upsert({
          where: { plaidTransactionId: txn.transaction_id },
          update: {
            amount: Math.abs(txn.amount),
            date: new Date(txn.date),
            name: transactionName,
            merchantName: txn.merchant_name ?? null,
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
            merchantName: txn.merchant_name ?? null,
            category: txn.category?.[0] || 'Other',
            subcategory: txn.category?.[1] || null,
            plaidMetadata: metadata,
          },
        });

        processedCount++;
      } catch (txnError) {
        console.error(`Error processing transaction ${txn.transaction_id}:`, txnError);
        errorCount++;
      }
    }

    console.log(`✅ SYNC COMPLETE - Fetched: ${all.length}, Processed: ${processedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      fetched: all.length,
      processed: processedCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    return NextResponse.json(
      { error: 'Failed to sync transactions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}