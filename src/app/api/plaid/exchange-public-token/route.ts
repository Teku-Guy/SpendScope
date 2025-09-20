// app/api/plaid/exchange-public-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { public_token } = await request.json();

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Check if this item is already connected
    const existingUser = await prisma.user.findFirst({
      where: {
        plaidItemId: item_id,
      },
    });

    let isExistingConnection = false;
    if (existingUser) {
      if (existingUser.id === session.user.id) {
        // Same user reconnecting - this is a refresh
        isExistingConnection = true;
      } else {
        // Different user trying to connect the same bank account
        return NextResponse.json({
          error: 'This bank account is already connected to another user',
        }, { status: 409 });
      }
    }

    // Update user with Plaid tokens
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plaidAccessToken: access_token,
        plaidItemId: item_id,
      },
    });

    // Get accounts
    const accountsResponse = await plaidClient.accountsGet({
      access_token,
    });

    // Store accounts in database
    const accounts = accountsResponse.data.accounts;
    for (const account of accounts) {
      // Properly type the account metadata for Prisma JSON
      const accountMetadata: Prisma.InputJsonValue = {
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name || null,
        type: account.type,
        subtype: account.subtype || null,
        balances: {
          available: account.balances.available || null,
          current: account.balances.current || null,
          limit: account.balances.limit || null,
          iso_currency_code: account.balances.iso_currency_code || null,
          unofficial_currency_code: account.balances.unofficial_currency_code || null,
        },
        mask: account.mask || null,
        persistent_account_id: account.persistent_account_id || null,
      };

      await prisma.bankAccount.upsert({
        where: { plaidAccountId: account.account_id },
        update: {
          name: account.name,
          officialName: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype || '',
          balance: account.balances.current || 0,
          metadata: accountMetadata,
        },
        create: {
          userId: session.user.id,
          plaidAccountId: account.account_id,
          name: account.name,
          officialName: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype || '',
          balance: account.balances.current || 0,
          metadata: accountMetadata,
        },
      });
    }

    return NextResponse.json({
      success: true,
      accounts: accounts.length,
      isExistingConnection,
      message: isExistingConnection
        ? 'Bank account refreshed successfully'
        : 'Bank account connected successfully',
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { error: 'Failed to connect bank account' },
      { status: 500 }
    );
  }
}