import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { PresetCategory } from '@prisma/client'

// GET /api/dashboard/presets - Get dashboard presets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category') as PresetCategory | null
    const isPublic = searchParams.get('public') === 'true'
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let userId: string | undefined

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      userId = user?.id
    }

    // Build where clause
    const where: any = {
      OR: [
        { isPublic: true },
        ...(userId ? [{ createdBy: userId }] : [])
      ]
    }

    if (category) {
      where.category = category
    }

    if (tags.length > 0) {
      where.tags = {
        hasEvery: tags
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ]
    }

    const [presets, total] = await Promise.all([
      prisma.dashboardPreset.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.dashboardPreset.count({ where })
    ])

    return NextResponse.json({
      presets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch dashboard presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 }
    )
  }
}

// POST /api/dashboard/presets - Create new dashboard preset
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
      tags = [],
      category = PresetCategory.PERSONAL,
      isPublic = false,
      thumbnailUrl
    } = body

    // Validate required fields
    if (!name || !description || !layoutData) {
      return NextResponse.json(
        { error: 'Name, description, and layout data are required' },
        { status: 400 }
      )
    }

    // Check if preset name already exists for public presets
    if (isPublic) {
      const existingPreset = await prisma.dashboardPreset.findFirst({
        where: {
          name: name,
          isPublic: true
        }
      })

      if (existingPreset) {
        return NextResponse.json(
          { error: 'Public preset name already exists' },
          { status: 409 }
        )
      }
    }

    const preset = await prisma.dashboardPreset.create({
      data: {
        name,
        description,
        layoutData,
        widgetConfigs: widgetConfigs || {},
        themeConfig: themeConfig || {},
        tags,
        category,
        isPublic,
        thumbnailUrl,
        createdBy: user.id
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

    return NextResponse.json({ preset })
  } catch (error) {
    console.error('Failed to create dashboard preset:', error)
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 }
    )
  }
}