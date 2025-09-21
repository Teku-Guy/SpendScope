import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/dashboard/layouts/[id] - Get specific dashboard layout
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const layout = await prisma.dashboardLayout.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!layout) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 })
    }

    return NextResponse.json({ layout })
  } catch (error) {
    console.error('Failed to fetch dashboard layout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch layout' },
      { status: 500 }
    )
  }
}

// PUT /api/dashboard/layouts/[id] - Update dashboard layout
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      layoutData,
      widgetConfigs,
      themeConfig,
      isDefault,
      setAsActive
    } = body

    // Check if layout exists and belongs to user
    const existingLayout = await prisma.dashboardLayout.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingLayout) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 })
    }

    // Check for name conflicts (excluding current layout)
    if (name && name !== existingLayout.name) {
      const nameConflict = await prisma.dashboardLayout.findFirst({
        where: {
          userId: user.id,
          name: name,
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Layout name already exists' },
          { status: 409 }
        )
      }
    }

    // Handle active status changes
    if (setAsActive) {
      await prisma.dashboardLayout.updateMany({
        where: {
          userId: user.id,
          id: { not: id }
        },
        data: { isActive: false }
      })
    }

    // Handle default status changes
    if (isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: {
          userId: user.id,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // Update the layout
    const updatedLayout = await prisma.dashboardLayout.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(layoutData && { layoutData }),
        ...(widgetConfigs && { widgetConfigs }),
        ...(themeConfig && { themeConfig }),
        ...(isDefault !== undefined && { isDefault }),
        ...(setAsActive !== undefined && { isActive: setAsActive })
      }
    })

    return NextResponse.json({ layout: updatedLayout })
  } catch (error) {
    console.error('Failed to update dashboard layout:', error)
    return NextResponse.json(
      { error: 'Failed to update layout' },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboard/layouts/[id] - Delete dashboard layout
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if layout exists and belongs to user
    const layout = await prisma.dashboardLayout.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!layout) {
      return NextResponse.json({ error: 'Layout not found' }, { status: 404 })
    }

    // Prevent deletion of the only layout
    const userLayoutCount = await prisma.dashboardLayout.count({
      where: { userId: user.id }
    })

    if (userLayoutCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only remaining layout' },
        { status: 400 }
      )
    }

    // If deleting active layout, activate another one
    if (layout.isActive) {
      const nextLayout = await prisma.dashboardLayout.findFirst({
        where: {
          userId: user.id,
          id: { not: id }
        },
        orderBy: { updatedAt: 'desc' }
      })

      if (nextLayout) {
        await prisma.dashboardLayout.update({
          where: { id: nextLayout.id },
          data: { isActive: true }
        })
      }
    }

    // Delete the layout
    await prisma.dashboardLayout.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete dashboard layout:', error)
    return NextResponse.json(
      { error: 'Failed to delete layout' },
      { status: 500 }
    )
  }
}