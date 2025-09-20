// app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface CreateBudgetRequest {
  name: string;
  category: string;
  budgetLimit: number;
  rules?: Record<string, unknown>;
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const budgets = await prisma.budgetCategory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const currentMonth = new Date();
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

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

        return {
          ...budget,
          budgetLimit: budgetLimit,
          currentSpend,
          percentage,
          remaining: budgetLimit - currentSpend,
        };
      })
    );

    return NextResponse.json({
      success: true,
      budgets: budgetsWithSpending,
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateBudgetRequest = await request.json();
    const { name, category, budgetLimit, rules } = body;

    if (!name || !category || !budgetLimit || budgetLimit <= 0) {
      return NextResponse.json(
        { error: 'Name, category, and budget limit are required' },
        { status: 400 }
      );
    }

    // Check if budget already exists for this category
    const existingBudget = await prisma.budgetCategory.findFirst({
      where: {
        userId: session.user.id,
        category,
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category' },
        { status: 400 }
      );
    }

    const budget = await prisma.budgetCategory.create({
      data: {
        userId: session.user.id,
        name,
        category,
        budgetLimit: new Prisma.Decimal(budgetLimit),
        rules: rules as Prisma.InputJsonValue || {},
      },
    });

    // Calculate current spending for the newly created budget
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

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
    const budgetLimitNum = parseFloat(budget.budgetLimit.toString());

    return NextResponse.json({
      success: true,
      budget: {
        ...budget,
        budgetLimit: budgetLimitNum,
        currentSpend,
        percentage: budgetLimitNum > 0 ? (currentSpend / budgetLimitNum) * 100 : 0,
        remaining: budgetLimitNum - currentSpend,
      },
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}