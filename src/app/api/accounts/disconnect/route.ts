import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { plaidClient } from '@/lib/plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        plaidAccessToken: true,
        plaidItemId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Check if account belongs to user
    const account = await prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        userId: user.id,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Delete all transactions for this account
    await prisma.transaction.deleteMany({
      where: { accountId: accountId },
    });

    // Delete the account
    await prisma.bankAccount.delete({
      where: { id: accountId },
    });

    // Check if this was the only account for this user
    const remainingAccounts = await prisma.bankAccount.count({
      where: { userId: user.id },
    });

    // If no accounts remain, remove Plaid access token and item ID
    if (remainingAccounts === 0 && user.plaidAccessToken && user.plaidItemId) {
      try {
        // Remove item from Plaid
        await plaidClient.itemRemove({
          access_token: user.plaidAccessToken,
        });
      } catch (plaidError) {
        console.error('Error removing Plaid item:', plaidError);
        // Continue even if Plaid removal fails
      }

      // Clear Plaid tokens from user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plaidAccessToken: null,
          plaidItemId: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
      remainingAccounts,
    });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}