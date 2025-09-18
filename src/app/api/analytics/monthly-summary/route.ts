// app/api/analytics/monthly-summary/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Get previous month boundaries
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Current month data
    const currentMonthData = await prisma.$queryRaw<{
      spending: number | null;
      income: number | null;
      transaction_count: bigint;
    }[]>`
      SELECT
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as spending,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${currentMonthStart}
        AND date <= ${currentMonthEnd}
    `;

    // Previous month data
    const previousMonthData = await prisma.$queryRaw<{
      spending: number | null;
      income: number | null;
      transaction_count: bigint;
    }[]>`
      SELECT
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as spending,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${previousMonthStart}
        AND date <= ${previousMonthEnd}
    `;

    const current = currentMonthData[0];
    const previous = previousMonthData[0];

    // Calculate metrics
    const currentSpending = parseFloat(current.spending?.toString() || '0');
    const currentIncome = parseFloat(current.income?.toString() || '0');
    const currentTransactions = Number(current.transaction_count || 0);

    const previousSpending = parseFloat(previous.spending?.toString() || '0');
    const previousIncome = parseFloat(previous.income?.toString() || '0');
    const previousTransactions = Number(previous.transaction_count || 0);

    // Calculate percentage changes
    const spendingChange = previousSpending > 0 
      ? ((currentSpending - previousSpending) / previousSpending) * 100 
      : 0;
    
    const incomeChange = previousIncome > 0 
      ? ((currentIncome - previousIncome) / previousIncome) * 100 
      : 0;
    
    const transactionChange = previousTransactions > 0 
      ? ((currentTransactions - previousTransactions) / previousTransactions) * 100 
      : 0;

    const responseData = {
      currentMonth: {
        spending: currentSpending,
        income: currentIncome,
        transactions: currentTransactions,
        netFlow: currentIncome - currentSpending
      },
      previousMonth: {
        spending: previousSpending,
        income: previousIncome,
        transactions: previousTransactions,
        netFlow: previousIncome - previousSpending
      },
      trends: {
        spendingChange,
        incomeChange,
        transactionChange
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly summary' },
      { status: 500 }
    );
  }
}