import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/dashboard/presets/[id]/apply - Apply preset to user's dashboard
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      saveAsNewLayout = false,
      layoutName = null,
      replaceCurrentLayout = false
    } = body

    // Get the preset
    const preset = await prisma.dashboardPreset.findFirst({
      where: {
        id,
        OR: [
          { isPublic: true },
          { createdBy: user.id }
        ]
      }
    })

    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    let layout

    if (saveAsNewLayout) {
      // Create a new layout from the preset
      const name = layoutName || `${preset.name} - Applied ${new Date().toLocaleDateString()}`

      // Check for name conflicts
      const existingLayout = await prisma.dashboardLayout.findFirst({
        where: {
          userId: user.id,
          name: name
        }
      })

      if (existingLayout) {
        return NextResponse.json(
          { error: 'Layout name already exists' },
          { status: 409 }
        )
      }

      // Deactivate current active layout
      await prisma.dashboardLayout.updateMany({
        where: { userId: user.id },
        data: { isActive: false }
      })

      // Create new layout from preset
      layout = await prisma.dashboardLayout.create({
        data: {
          userId: user.id,
          name,
          description: `Applied from preset: ${preset.name}`,
          layoutData: preset.layoutData as Prisma.InputJsonValue,
          widgetConfigs: (preset.widgetConfigs as Prisma.InputJsonValue) || {},
          themeConfig: (preset.themeConfig as Prisma.InputJsonValue) || {},
          isActive: true,
          isDefault: false
        }
      })
    } else if (replaceCurrentLayout) {
      // Update the current active layout
      const currentLayout = await prisma.dashboardLayout.findFirst({
        where: {
          userId: user.id,
          isActive: true
        }
      })

      if (!currentLayout) {
        // No active layout, create a new one
        layout = await prisma.dashboardLayout.create({
          data: {
            userId: user.id,
            name: 'My Dashboard',
            description: `Applied from preset: ${preset.name}`,
            layoutData: preset.layoutData as Prisma.InputJsonValue,
            widgetConfigs: (preset.widgetConfigs as Prisma.InputJsonValue) || {},
            themeConfig: (preset.themeConfig as Prisma.InputJsonValue) || {},
            isActive: true,
            isDefault: true
          }
        })
      } else {
        // Update existing active layout
        layout = await prisma.dashboardLayout.update({
          where: { id: currentLayout.id },
          data: {
            layoutData: preset.layoutData as Prisma.InputJsonValue,
            widgetConfigs: (preset.widgetConfigs as Prisma.InputJsonValue) || {},
            themeConfig: (preset.themeConfig as Prisma.InputJsonValue) || {},
            description: `Applied from preset: ${preset.name}`
          }
        })
      }
    } else {
      // Default: replace current layout without saving
      return NextResponse.json({
        success: true,
        layout: {
          layoutData: preset.layoutData as Prisma.InputJsonValue,
          widgetConfigs: (preset.widgetConfigs as Prisma.InputJsonValue) || {},
          themeConfig: (preset.themeConfig as Prisma.InputJsonValue) || {}
        },
        message: 'Preset applied temporarily. Save to persist changes.'
      })
    }

    // Increment preset usage count
    await prisma.dashboardPreset.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    })

    return NextResponse.json({
      success: true,
      layout,
      message: saveAsNewLayout
        ? 'Preset saved as new layout and activated'
        : 'Current layout updated with preset'
    })
  } catch (error) {
    console.error('Failed to apply dashboard preset:', error)
    return NextResponse.json(
      { error: 'Failed to apply preset' },
      { status: 500 }
    )
  }
}