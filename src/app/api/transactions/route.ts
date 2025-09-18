// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface WhereClause {
  userId: string;
  date: {
    gte: Date;
  };
  category?: string;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    merchantName?: { contains: string; mode: 'insensitive' };
  }>;
}

interface TransactionWithAccount {
  id: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string;
  account: {
    name: string;
    type: string;
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const category = searchParams.get('category') || undefined;
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!, 10) : 30;
    const search = searchParams.get('search') || undefined;

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build where clause
    const whereClause: WhereClause = {
      userId: session.user.id,
      date: {
        gte: startDate
      }
    };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { merchantName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const rawTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      ...(limit && { take: limit })
    });

    const transactions: TransactionWithAccount[] = rawTransactions.map(t => ({
      id: t.id,
      amount: parseFloat(t.amount.toString()),
      date: t.date.toISOString(),
      name: t.name,
      merchantName: t.merchantName,
      category: t.category,
      account: t.account
    }));

    return NextResponse.json({
      success: true,
      transactions
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}