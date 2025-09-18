// app/api/budgets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UpdateBudgetRequest {
  name?: string;
  budgetLimit?: number;
  rules?: Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const budget = await prisma.budgetCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    // Calculate current spending
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

    return NextResponse.json({
      success: true,
      budget: {
        ...budget,
        budgetLimit,
        currentSpend,
        percentage: budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0,
        remaining: budgetLimit - currentSpend,
      },
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateBudgetRequest = await request.json();
    const { name, budgetLimit, rules } = body;

    const existingBudget = await prisma.budgetCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const updateData: {
      name?: string;
      budgetLimit?: Prisma.Decimal;
      rules?: Prisma.InputJsonValue;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (budgetLimit !== undefined) updateData.budgetLimit = new Prisma.Decimal(budgetLimit);
    if (rules !== undefined) updateData.rules = rules as Prisma.InputJsonValue;

    const updatedBudget = await prisma.budgetCategory.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      budget: {
        ...updatedBudget,
        budgetLimit: parseFloat(updatedBudget.budgetLimit.toString()),
      },
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingBudget = await prisma.budgetCategory.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    await prisma.budgetCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}