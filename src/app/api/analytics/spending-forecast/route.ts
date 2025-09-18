// app/api/analytics/spending-forecast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface ForecastData {
  category: string;
  currentSpending: number;
  forecastedSpending: number;
  budgetLimit?: number;
  riskLevel: 'low' | 'medium' | 'high';
  daysRemaining: number;
  averageDailySpending: number;
  recommendedDailySpending: number;
}

interface MonthlyForecast {
  totalCurrentSpending: number;
  totalForecastedSpending: number;
  totalBudgetLimit: number;
  overallRiskLevel: 'low' | 'medium' | 'high';
  categoriesAtRisk: number;
  recommendations: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category'); // Optional: forecast for specific category

    // Get current month info
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = currentMonthEnd.getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    // Get current month spending by category
    const spendingByCategory = await prisma.$queryRaw<{
      category: string;
      total_spending: string;
      transaction_count: string;
    }[]>`
      SELECT
        category,
        SUM(amount) as total_spending,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE "userId" = ${session.user.id}
        AND date >= ${currentMonthStart}
        AND date <= ${now}
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
      GROUP BY category
      ORDER BY total_spending DESC
    `;

    // Get budgets
    const budgets = await prisma.budgetCategory.findMany({
      where: {
        userId: session.user.id,
        ...(category && { category })
      },
    });

    const budgetMap = new Map(
      budgets.map(b => [b.category, parseFloat(b.budgetLimit.toString())])
    );

    // Calculate forecasts for each category
    const forecasts: ForecastData[] = [];
    let totalCurrentSpending = 0;
    let totalForecastedSpending = 0;
    let totalBudgetLimit = 0;
    let categoriesAtRisk = 0;

    for (const categoryData of spendingByCategory) {
      const currentSpending = parseFloat(categoryData.total_spending.toString());
      const transactionCount = parseInt(categoryData.transaction_count.toString());

      // Calculate daily average and forecast
      const averageDailySpending = daysElapsed > 0 ? currentSpending / daysElapsed : 0;
      const forecastedSpending = currentSpending + (averageDailySpending * daysRemaining);

      const budgetLimit = budgetMap.get(categoryData.category);
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      let recommendedDailySpending = averageDailySpending;

      if (budgetLimit) {
        const currentPercentage = (currentSpending / budgetLimit) * 100;
        const forecastedPercentage = (forecastedSpending / budgetLimit) * 100;

        if (forecastedPercentage > 100) {
          riskLevel = 'high';
          categoriesAtRisk++;
          // Calculate recommended daily spending to stay within budget
          const remainingBudget = Math.max(0, budgetLimit - currentSpending);
          recommendedDailySpending = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;
        } else if (forecastedPercentage > 80) {
          riskLevel = 'medium';
        }

        totalBudgetLimit += budgetLimit;
      }

      totalCurrentSpending += currentSpending;
      totalForecastedSpending += forecastedSpending;

      forecasts.push({
        category: categoryData.category,
        currentSpending,
        forecastedSpending,
        budgetLimit,
        riskLevel,
        daysRemaining,
        averageDailySpending,
        recommendedDailySpending,
      });
    }

    // Determine overall risk level
    let overallRiskLevel: 'low' | 'medium' | 'high' = 'low';
    if (categoriesAtRisk > 2 || (totalBudgetLimit > 0 && totalForecastedSpending > totalBudgetLimit * 1.1)) {
      overallRiskLevel = 'high';
    } else if (categoriesAtRisk > 0 || (totalBudgetLimit > 0 && totalForecastedSpending > totalBudgetLimit * 0.9)) {
      overallRiskLevel = 'medium';
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (categoriesAtRisk > 0) {
      recommendations.push(`${categoriesAtRisk} categories are at risk of exceeding their budgets this month`);
    }

    const highRiskCategories = forecasts.filter(f => f.riskLevel === 'high');
    if (highRiskCategories.length > 0) {
      const topRiskCategory = highRiskCategories[0];
      const savings = topRiskCategory.averageDailySpending - topRiskCategory.recommendedDailySpending;
      if (savings > 0) {
        recommendations.push(
          `Reduce ${topRiskCategory.category.toLowerCase()} spending by $${savings.toFixed(2)} per day to stay within budget`
        );
      }
    }

    if (totalBudgetLimit > 0) {
      const totalBudgetUtilization = (totalForecastedSpending / totalBudgetLimit) * 100;
      if (totalBudgetUtilization > 100) {
        const excess = totalForecastedSpending - totalBudgetLimit;
        recommendations.push(
          `Overall spending is forecasted to exceed total budget by $${excess.toFixed(2)}`
        );
      } else if (totalBudgetUtilization < 70) {
        const remaining = totalBudgetLimit - totalForecastedSpending;
        recommendations.push(
          `You're on track to have $${remaining.toFixed(2)} remaining from your total budget`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Your spending is on track for this month!');
    }

    const monthlyForecast: MonthlyForecast = {
      totalCurrentSpending,
      totalForecastedSpending,
      totalBudgetLimit,
      overallRiskLevel,
      categoriesAtRisk,
      recommendations,
    };

    return NextResponse.json({
      success: true,
      forecasts: forecasts.sort((a, b) => b.forecastedSpending - a.forecastedSpending),
      monthlyForecast,
      metadata: {
        daysElapsed,
        daysRemaining,
        daysInMonth,
        forecastAccuracy: daysElapsed > 7 ? 'high' : daysElapsed > 3 ? 'medium' : 'low',
      },
    });

  } catch (error) {
    console.error('Error generating spending forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate spending forecast' },
      { status: 500 }
    );
  }
}