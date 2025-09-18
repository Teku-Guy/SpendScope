// app/api/analytics/spending-trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SpendingDataRow {
  period_date: Date;
  spending: string;
  income: string;
  transaction_count: string;
}

interface FormattedSpendingData {
  date: string;
  amount: number;
  income: number;
  netFlow: number;
  transactionCount: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range and grouping
    let days: number;

    switch (period) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '1y':
        days = 365;
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // PostgreSQL query for daily/monthly spending aggregation
    const spendingData = await prisma.$queryRaw<SpendingDataRow[]>`
      SELECT
        DATE_TRUNC(
          ${period === '1y' ? 'month' : 'day'},
          date
        ) as period_date,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as spending,
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${startDate}
      GROUP BY period_date
      ORDER BY period_date ASC
    `;

    // Format data for charts
    const formattedData: FormattedSpendingData[] = spendingData.map(row => ({
      date: row.period_date.toISOString().split('T')[0],
      amount: parseFloat(row.spending.toString()),
      income: parseFloat(row.income.toString()),
      netFlow: parseFloat(row.income.toString()) - parseFloat(row.spending.toString()),
      transactionCount: parseInt(row.transaction_count.toString(), 10)
    }));

    // Fill in missing dates with zero values
    const filledData = fillMissingDates(formattedData, days, period === '1y');

    return NextResponse.json({
      success: true,
      data: filledData,
      period,
      summary: {
        totalSpent: filledData.reduce((sum, item) => sum + item.amount, 0),
        totalIncome: filledData.reduce((sum, item) => sum + item.income, 0),
        averageDaily: filledData.length > 0 ? 
          filledData.reduce((sum, item) => sum + item.amount, 0) / filledData.length : 0
      }
    });

  } catch (error) {
    console.error('Error fetching spending trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spending trends' },
      { status: 500 }
    );
  }
}

function fillMissingDates(
  data: FormattedSpendingData[], 
  days: number, 
  isMonthly: boolean
): FormattedSpendingData[] {
  const result: FormattedSpendingData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    
    if (isMonthly) {
      date.setMonth(date.getMonth() - i);
      const dateStr = `${date.toISOString().substr(0, 7)}-01`;
      const existing = data.find(item => item.date.startsWith(dateStr.substr(0, 7)));
      
      result.push({
        date: dateStr,
        amount: existing ? existing.amount : 0,
        income: existing ? existing.income : 0,
        netFlow: existing ? existing.netFlow : 0,
        transactionCount: existing ? existing.transactionCount : 0
      });
    } else {
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = data.find(item => item.date === dateStr);
      
      result.push({
        date: dateStr,
        amount: existing ? existing.amount : 0,
        income: existing ? existing.income : 0,
        netFlow: existing ? existing.netFlow : 0,
        transactionCount: existing ? existing.transactionCount : 0
      });
    }
  }
  
  return result;
}