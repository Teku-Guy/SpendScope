// app/api/budget-alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isRead } = body;

    const alert = await prisma.budgetAlert.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updatedAlert = await prisma.budgetAlert.update({
      where: { id: params.id },
      data: { isRead: isRead ?? true },
    });

    return NextResponse.json({
      success: true,
      alert: {
        ...updatedAlert,
        currentAmount: updatedAlert.currentAmount ? parseFloat(updatedAlert.currentAmount.toString()) : null,
        budgetLimit: updatedAlert.budgetLimit ? parseFloat(updatedAlert.budgetLimit.toString()) : null,
        projectedAmount: updatedAlert.projectedAmount ? parseFloat(updatedAlert.projectedAmount.toString()) : null,
      },
    });
  } catch (error) {
    console.error('Error updating budget alert:', error);
    return NextResponse.json(
      { error: 'Failed to update budget alert' },
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

    const alert = await prisma.budgetAlert.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await prisma.budgetAlert.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting budget alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget alert' },
      { status: 500 }
    );
  }
}