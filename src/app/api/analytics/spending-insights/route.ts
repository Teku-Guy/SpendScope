// app/api/analytics/spending-insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SpendingInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category?: string;
  amount?: number;
  percentage?: number;
  recommendation?: string;
}

interface MerchantPattern {
  merchantName: string;
  frequency: string;
  avg_amount: string;
  category: string;
}

interface CategoryTrend {
  category: string;
  current_month: string;
  previous_month: string;
  change_percent: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const insights: SpendingInsight[] = [];

    // Get date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. Analyze spending trends by category
    const categoryTrends = await prisma.$queryRaw<CategoryTrend[]>`
      SELECT
        category,
        SUM(CASE WHEN date >= ${currentMonthStart} THEN amount ELSE 0 END) as current_month,
        SUM(CASE WHEN date >= ${previousMonthStart} AND date <= ${previousMonthEnd} THEN amount ELSE 0 END) as previous_month
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${previousMonthStart}
      GROUP BY category
      HAVING SUM(CASE WHEN date >= ${previousMonthStart} AND date <= ${previousMonthEnd} THEN amount ELSE 0 END) > 0
    `;

    // Process category trends
    for (const trend of categoryTrends) {
      const currentAmount = parseFloat(trend.current_month.toString());
      const previousAmount = parseFloat(trend.previous_month.toString());
      const changePercent = previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0;

      if (Math.abs(changePercent) > 50 && currentAmount > 100) {
        insights.push({
          type: changePercent > 0 ? 'warning' : 'opportunity',
          title: `${trend.category} Spending ${changePercent > 0 ? 'Spike' : 'Drop'}`,
          description: `Your ${trend.category.toLowerCase()} spending has ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% this month`,
          impact: Math.abs(changePercent) > 100 ? 'high' : 'medium',
          category: trend.category,
          amount: currentAmount,
          percentage: changePercent,
          recommendation: changePercent > 0
            ? `Consider reviewing your ${trend.category.toLowerCase()} expenses to identify areas for savings`
            : `Great job reducing your ${trend.category.toLowerCase()} spending! Consider reallocating this money to savings.`
        });
      }
    }

    // 2. Identify frequent merchants
    const merchantPatterns = await prisma.$queryRaw<MerchantPattern[]>`
      SELECT
        "merchantName",
        COUNT(*) as frequency,
        AVG(amount) as avg_amount,
        category
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND "merchantName" IS NOT NULL
        AND date >= ${currentMonthStart}
      GROUP BY "merchantName", category
      HAVING COUNT(*) >= 3
      ORDER BY frequency DESC, avg_amount DESC
      LIMIT 5
    `;

    // Process merchant patterns
    for (const pattern of merchantPatterns) {
      const frequency = parseInt(pattern.frequency.toString());
      const avgAmount = parseFloat(pattern.avg_amount.toString());
      const monthlyEstimate = frequency * avgAmount;

      if (monthlyEstimate > 200) {
        insights.push({
          type: 'trend',
          title: `Frequent ${pattern.merchantName} Visits`,
          description: `You've visited ${pattern.merchantName} ${frequency} times this month, spending an average of $${avgAmount.toFixed(2)} per visit`,
          impact: monthlyEstimate > 500 ? 'high' : 'medium',
          category: pattern.category,
          amount: monthlyEstimate,
          recommendation: `Consider if this spending aligns with your budget for ${pattern.category.toLowerCase()}`
        });
      }
    }

    // 3. Check for unusual large transactions
    const unusualTransactions = await prisma.$queryRaw<{
      amount: string;
      category: string;
      name: string;
      date: Date;
      merchantName: string | null;
    }[]>`
      SELECT amount, category, name, date, "merchantName"
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${currentMonthStart}
        AND amount > (
          SELECT AVG(amount) + 2 * STDDEV(amount)
          FROM transactions
          WHERE "userId" = ${session.user.id}
            AND date >= ${previousMonthStart}
        )
      ORDER BY amount DESC
      LIMIT 3
    `;

    // Process unusual transactions
    for (const transaction of unusualTransactions) {
      const amount = parseFloat(transaction.amount.toString());
      insights.push({
        type: 'anomaly',
        title: `Large ${transaction.category} Purchase`,
        description: `Unusual ${amount > 1000 ? 'large' : 'significant'} transaction of $${amount.toFixed(2)} at ${transaction.merchantName || transaction.name}`,
        impact: amount > 1000 ? 'high' : 'medium',
        category: transaction.category,
        amount,
        recommendation: 'Verify this transaction and consider if it fits within your budget'
      });
    }

    // 4. Budget utilization insights
    const budgets = await prisma.budgetCategory.findMany({
      where: { userId: session.user.id },
    });

    for (const budget of budgets) {
      const spending = await prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          category: budget.category,
          date: {
            gte: currentMonthStart,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const currentSpend = parseFloat(spending._sum.amount?.toString() || '0');
      const budgetLimit = parseFloat(budget.budgetLimit.toString());
      const percentage = budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0;

      if (percentage > 90) {
        insights.push({
          type: 'warning',
          title: `${budget.name} Budget Almost Exceeded`,
          description: `You've used ${percentage.toFixed(1)}% of your ${budget.name} budget`,
          impact: 'high',
          category: budget.category,
          amount: currentSpend,
          percentage,
          recommendation: `Consider reducing ${budget.category.toLowerCase()} spending for the rest of the month`
        });
      } else if (percentage < 50) {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysElapsed = now.getDate();
        const expectedPercentage = (daysElapsed / daysInMonth) * 100;

        if (percentage < expectedPercentage * 0.7) {
          insights.push({
            type: 'opportunity',
            title: `${budget.name} Budget Underutilized`,
            description: `You've only used ${percentage.toFixed(1)}% of your ${budget.name} budget`,
            impact: 'low',
            category: budget.category,
            amount: budgetLimit - currentSpend,
            percentage,
            recommendation: `You have $${(budgetLimit - currentSpend).toFixed(2)} remaining in this category`
          });
        }
      }
    }

    // Sort insights by impact
    const sortedInsights = insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });

    return NextResponse.json({
      success: true,
      insights: sortedInsights.slice(0, 10), // Limit to top 10 insights
      summary: {
        total: sortedInsights.length,
        highImpact: sortedInsights.filter(i => i.impact === 'high').length,
        warnings: sortedInsights.filter(i => i.type === 'warning').length,
        opportunities: sortedInsights.filter(i => i.type === 'opportunity').length,
      }
    });

  } catch (error) {
    console.error('Error generating spending insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate spending insights' },
      { status: 500 }
    );
  }
}