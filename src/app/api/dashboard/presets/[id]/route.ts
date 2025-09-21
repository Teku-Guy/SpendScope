import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/dashboard/presets/[id] - Get specific dashboard preset
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    let userId: string | undefined

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      userId = user?.id
    }

    const preset = await prisma.dashboardPreset.findFirst({
      where: {
        id: id,
        OR: [
          { isPublic: true },
          ...(userId ? [{ createdBy: userId }] : [])
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Increment usage count
    await prisma.dashboardPreset.update({
      where: { id: id },
      data: { usageCount: { increment: 1 } }
    })

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Failed to fetch dashboard preset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset' },
      { status: 500 }
    )
  }
}

// PUT /api/dashboard/presets/[id] - Update dashboard preset
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
      tags,
      category,
      isPublic,
      thumbnailUrl
    } = body

    // Check if preset exists and user has permission to edit
    const existingPreset = await prisma.dashboardPreset.findFirst({
      where: {
        id: id,
        createdBy: user.id
      }
    })

    if (!existingPreset) {
      return NextResponse.json(
        { error: 'Preset not found or access denied' },
        { status: 404 }
      )
    }

    // Check for name conflicts if making public
    if (isPublic && name && name !== existingPreset.name) {
      const nameConflict = await prisma.dashboardPreset.findFirst({
        where: {
          name: name,
          isPublic: true,
          id: { not: id }
        }
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Public preset name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedPreset = await prisma.dashboardPreset.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(layoutData && { layoutData }),
        ...(widgetConfigs && { widgetConfigs }),
        ...(themeConfig && { themeConfig }),
        ...(tags && { tags }),
        ...(category && { category }),
        ...(isPublic !== undefined && { isPublic }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({ preset: updatedPreset })
  } catch (error) {
    console.error('Failed to update dashboard preset:', error)
    return NextResponse.json(
      { error: 'Failed to update preset' },
      { status: 500 }
    )
  }
}

// DELETE /api/dashboard/presets/[id] - Delete dashboard preset
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

    // Check if preset exists and user has permission to delete
    const preset = await prisma.dashboardPreset.findFirst({
      where: {
        id: id,
        createdBy: user.id
      }
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found or access denied' },
        { status: 404 }
      )
    }

    // Delete associated ratings first
    await prisma.presetRating.deleteMany({
      where: { presetId: id }
    })

    // Delete the preset
    await prisma.dashboardPreset.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete dashboard preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 }
    )
  }
}