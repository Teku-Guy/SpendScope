// app/api/analytics/category-breakdown/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface CategoryDataRow {
  category: string;
  amount: string;
  transaction_count: string;
}

interface FormattedCategoryData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
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

    // Query for category breakdown
    const categoryData = await prisma.$queryRaw<CategoryDataRow[]>`
      SELECT
        category,
        SUM(amount) as amount,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${startDate}
        AND amount > 0
      GROUP BY category
      ORDER BY amount DESC
    `;

    // Calculate total spending for percentages
    const totalSpending = categoryData.reduce((sum, row) =>
      sum + parseFloat(row.amount.toString()), 0
    );

    // Format data for frontend
    const formattedData: FormattedCategoryData[] = categoryData.map(row => {
      const amount = parseFloat(row.amount.toString());
      return {
        category: row.category,
        amount,
        count: parseInt(row.transaction_count.toString(), 10),
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedData,
      period,
      summary: {
        totalSpent: totalSpending,
        categoriesCount: formattedData.length,
        topCategory: formattedData[0]?.category || null
      }
    });

  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category breakdown' },
      { status: 500 }
    );
  }
}