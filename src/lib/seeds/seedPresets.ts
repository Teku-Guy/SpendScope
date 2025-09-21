import { prisma } from '@/lib/prisma'
import { DEFAULT_PRESETS } from './defaultPresets'

export async function seedDefaultPresets() {
  console.log('🌱 Seeding default dashboard presets...')

  for (const preset of DEFAULT_PRESETS) {
    try {
      // Check if preset already exists
      const existing = await prisma.dashboardPreset.findUnique({
        where: { id: preset.id }
      })

      if (existing) {
        // Update existing preset
        await prisma.dashboardPreset.update({
          where: { id: preset.id },
          data: {
            name: preset.name,
            description: preset.description,
            category: preset.category,
            tags: preset.tags,
            isPublic: preset.isPublic,
            layoutData: preset.layoutData,
            widgetConfigs: preset.widgetConfigs || {},
            usageCount: existing.usageCount // Preserve usage count
          }
        })
        console.log(`✅ Updated preset: ${preset.name}`)
      } else {
        // Create new preset
        await prisma.dashboardPreset.create({
          data: {
            id: preset.id,
            name: preset.name,
            description: preset.description,
            category: preset.category,
            tags: preset.tags,
            isPublic: preset.isPublic,
            layoutData: preset.layoutData,
            widgetConfigs: preset.widgetConfigs || {},
            usageCount: preset.usageCount,
            createdBy: null // System presets have no creator
          }
        })
        console.log(`✅ Created preset: ${preset.name}`)
      }
    } catch (error) {
      console.error(`❌ Failed to seed preset ${preset.name}:`, error)
    }
  }

  console.log('🎉 Default presets seeding completed!')
}

// If this file is run directly
if (require.main === module) {
  seedDefaultPresets()
    .then(() => {
      console.log('Seeding finished successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seeding failed:', error)
      process.exit(1)
    })
}