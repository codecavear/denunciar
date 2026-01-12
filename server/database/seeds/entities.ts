import { getDb } from '../../utils/db'
import { entities } from '../schema'

const seedEntities = [
  {
    name: 'Water & Sewage',
    description: 'Handles water supply issues, sewage problems, pipe leaks, and drainage',
    keywords: ['water', 'leak', 'pipe', 'sewage', 'drain', 'flooding', 'sewer', 'plumbing', 'hydrant', 'water pressure'],
    contactEmail: 'water@city.gov'
  },
  {
    name: 'Roads & Infrastructure',
    description: 'Responsible for road maintenance, potholes, sidewalks, and traffic signs',
    keywords: ['pothole', 'road', 'street', 'sidewalk', 'pavement', 'asphalt', 'crack', 'traffic sign', 'crosswalk', 'bridge'],
    contactEmail: 'roads@city.gov'
  },
  {
    name: 'Public Lighting',
    description: 'Manages streetlights, public area lighting, and electrical issues in public spaces',
    keywords: ['light', 'lamp', 'streetlight', 'dark', 'broken light', 'electrical', 'pole', 'illumination', 'bulb'],
    contactEmail: 'lighting@city.gov'
  },
  {
    name: 'Waste Management',
    description: 'Handles garbage collection, recycling, illegal dumping, and waste disposal',
    keywords: ['garbage', 'trash', 'waste', 'recycling', 'dump', 'litter', 'bin', 'container', 'rubbish', 'collection'],
    contactEmail: 'waste@city.gov'
  },
  {
    name: 'Parks & Recreation',
    description: 'Maintains parks, playgrounds, green spaces, and recreational facilities',
    keywords: ['park', 'playground', 'bench', 'tree', 'grass', 'garden', 'fountain', 'sports', 'swing', 'vandalism'],
    contactEmail: 'parks@city.gov'
  },
  {
    name: 'Public Safety',
    description: 'Addresses safety hazards, abandoned vehicles, and public nuisances',
    keywords: ['safety', 'hazard', 'abandoned', 'vehicle', 'graffiti', 'vandalism', 'noise', 'danger', 'emergency', 'crime'],
    contactEmail: 'safety@city.gov'
  },
  {
    name: 'Building & Permits',
    description: 'Handles building code violations, construction issues, and structural concerns',
    keywords: ['building', 'construction', 'permit', 'structure', 'demolition', 'renovation', 'code violation', 'unsafe building'],
    contactEmail: 'building@city.gov'
  }
]

export async function seedEntitiesTable() {
  const db = getDb()

  console.log('Seeding entities...')

  for (const entity of seedEntities) {
    await db.insert(entities).values(entity).onConflictDoNothing()
  }

  console.log(`Seeded ${seedEntities.length} entities`)
}

if (import.meta.main) {
  seedEntitiesTable()
    .then(() => {
      console.log('Seed complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seed failed:', error)
      process.exit(1)
    })
}
