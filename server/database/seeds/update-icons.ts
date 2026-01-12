import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { entities } from '../schema'

const iconMap: Record<string, string> = {
  'Water & Sewage': 'i-lucide-droplets',
  'Roads & Infrastructure': 'i-lucide-road',
  'Public Lighting': 'i-lucide-lightbulb',
  'Waste Management': 'i-lucide-trash-2',
  'Parks & Recreation': 'i-lucide-trees',
  'Public Safety': 'i-lucide-shield-alert',
  'Building & Permits': 'i-lucide-building'
}

async function updateIcons() {
  const db = getDb()

  console.log('Updating entity icons...')

  for (const [name, icon] of Object.entries(iconMap)) {
    await db
      .update(entities)
      .set({ icon })
      .where(eq(entities.name, name))
    console.log(`Updated ${name} -> ${icon}`)
  }

  console.log('Done!')
}

updateIcons()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
