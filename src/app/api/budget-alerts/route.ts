// app/api/budget-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AlertType, AlertSeverity, Prisma } from '@prisma/client';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const alerts = await prisma.budgetAlert.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format the alerts for frontend
    const formattedAlerts = alerts.map(alert => ({
      ...alert,
      currentAmount: alert.currentAmount ? parseFloat(alert.currentAmount.toString()) : null,
      budgetLimit: alert.budgetLimit ? parseFloat(alert.budgetLimit.toString()) : null,
      projectedAmount: alert.projectedAmount ? parseFloat(alert.projectedAmount.toString()) : null,
    }));

    return NextResponse.json({
      success: true,
      alerts: formattedAlerts,
    });
  } catch (error) {
    console.error('Error fetching budget alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget alerts' },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for budget overspending and create alerts
    const budgets = await prisma.budgetCategory.findMany({
      where: { userId: session.user.id },
    });

    const alerts = [];
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

    for (const budget of budgets) {
      const spending = await prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          category: budget.category,
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: {
          amount: true,
        },
      });

      const currentSpend = parseFloat(spending._sum.amount?.toString() || '0');
      const budgetLimit = parseFloat(budget.budgetLimit.toString());
      const percentage = budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0;

      // Check if we need to create alerts
      if (percentage >= 100) {
        // Budget exceeded
        const existingAlert = await prisma.budgetAlert.findFirst({
          where: {
            userId: session.user.id,
            type: AlertType.BUDGET_EXCEEDED,
            category: budget.category,
            createdAt: {
              gte: startOfMonth,
            },
          },
        });

        if (!existingAlert) {
          const alert = await prisma.budgetAlert.create({
            data: {
              userId: session.user.id,
              type: AlertType.BUDGET_EXCEEDED,
              category: budget.category,
              message: `You've exceeded your ${budget.name} budget by $${(currentSpend - budgetLimit).toFixed(2)}`,
              severity: AlertSeverity.HIGH,
              currentAmount: new Prisma.Decimal(currentSpend),
              budgetLimit: budget.budgetLimit,
              metadata: { budgetId: budget.id } as Prisma.InputJsonValue,
            },
          });
          alerts.push(alert);
        }
      } else if (percentage >= 80) {
        // Approaching budget limit
        const existingAlert = await prisma.budgetAlert.findFirst({
          where: {
            userId: session.user.id,
            type: AlertType.PROJECTED_OVERSPEND,
            category: budget.category,
            createdAt: {
              gte: startOfMonth,
            },
          },
        });

        if (!existingAlert) {
          const alert = await prisma.budgetAlert.create({
            data: {
              userId: session.user.id,
              type: AlertType.PROJECTED_OVERSPEND,
              category: budget.category,
              message: `You've used ${percentage.toFixed(1)}% of your ${budget.name} budget`,
              severity: AlertSeverity.MEDIUM,
              currentAmount: new Prisma.Decimal(currentSpend),
              budgetLimit: budget.budgetLimit,
              metadata: { budgetId: budget.id } as Prisma.InputJsonValue,
            },
          });
          alerts.push(alert);
        }
      }
    }

    return NextResponse.json({
      success: true,
      alertsCreated: alerts.length,
      alerts: alerts.map(alert => ({
        ...alert,
        currentAmount: alert.currentAmount ? parseFloat(alert.currentAmount.toString()) : null,
        budgetLimit: alert.budgetLimit ? parseFloat(alert.budgetLimit.toString()) : null,
      })),
    });
  } catch (error) {
    console.error('Error creating budget alerts:', error);
    return NextResponse.json(
      { error: 'Failed to create budget alerts' },
      { status: 500 }
    );
  }
}