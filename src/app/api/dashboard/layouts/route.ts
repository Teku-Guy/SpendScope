import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { LayoutItem, WidgetConfig } from '@/lib/widgets/types'

// GET /api/dashboard/layouts - Get user's dashboard layouts
export async function GET() {
  try {
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

    const layouts = await prisma.dashboardLayout.findMany({
      where: { userId: user.id },
      orderBy: [
        { isActive: 'desc' },
        { isDefault: 'desc' },
        { updatedAt: 'desc' }
      ]
    })

    return NextResponse.json({ layouts })
  } catch (error) {
    console.error('Failed to fetch dashboard layouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch layouts' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/layouts - Create new dashboard layout
export async function POST(request: NextRequest) {
  try {
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
      isDefault = false,
      setAsActive = true
    } = body

    // Validate required fields
    if (!name || !layoutData) {
      return NextResponse.json(
        { error: 'Name and layout data are required' },
        { status: 400 }
      )
    }

    // Check if layout name already exists for this user
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

    // If setting as active, deactivate other layouts
    if (setAsActive) {
      await prisma.dashboardLayout.updateMany({
        where: { userId: user.id },
        data: { isActive: false }
      })
    }

    // If setting as default, remove default from others
    if (isDefault) {
      await prisma.dashboardLayout.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      })
    }

    const layout = await prisma.dashboardLayout.create({
      data: {
        userId: user.id,
        name,
        description,
        layoutData,
        widgetConfigs: widgetConfigs || {},
        themeConfig: themeConfig || {},
        isDefault,
        isActive: setAsActive
      }
    })

    return NextResponse.json({ layout })
  } catch (error) {
    console.error('Failed to create dashboard layout:', error)
    return NextResponse.json(
      { error: 'Failed to create layout' },
      { status: 500 }
    )
  }
}