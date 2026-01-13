import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { entities } from '../database/schema'
import 'dotenv/config'

// Validate environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL, { prepare: false })
const db = drizzle(client)

const initialEntities = [
  {
    name: 'Infraestructura y Obras Públicas',
    description: 'Baches, calles en mal estado, veredas rotas, obras inconclusas.',
    keywords: ['bache', 'calle', 'pavimento', 'vereda', 'obra', 'asfalto'],
    icon: 'construction'
  },
  {
    name: 'Alumbrado Público',
    description: 'Luces quemadas, postes caídos, zonas oscuras.',
    keywords: ['luz', 'lampara', 'poste', 'oscuridad', 'farol'],
    icon: 'lightbulb'
  },
  {
    name: 'Higiene Urbana',
    description: 'Basurales, recolección de residuos, limpieza de calles.',
    keywords: ['basura', 'residuos', 'limpieza', 'suciedad', 'contenedor'],
    icon: 'trash-2'
  },
  {
    name: 'Espacios Verdes',
    description: 'Mantenimiento de plazas, parques, arbolado, poda.',
    keywords: ['plaza', 'parque', 'arbol', 'poda', 'rama', 'pasto'],
    icon: 'trees'
  },
  {
    name: 'Aguas y Saneamiento',
    description: 'Fugas de agua, cloacas desbordadas, falta de suministro.',
    keywords: ['agua', 'fuga', 'caño', 'cloaca', 'desague'],
    icon: 'droplets'
  },
  {
    name: 'Seguridad y Tránsito',
    description: 'Señalización, semáforos rotos, vehículos abandonados.',
    keywords: ['semaforo', 'señal', 'transito', 'seguridad', 'auto', 'coche'],
    icon: 'shield-alert'
  }
]

async function main() {
  console.log('🌱 Seeding database...')

  try {
    for (const entity of initialEntities) {
      await db.insert(entities).values({
        name: entity.name,
        description: entity.description,
        keywords: entity.keywords,
        icon: entity.icon,
        isActive: true, // Default
      }).onConflictDoNothing() // Prevent duplicates if re-run
    }
    console.log('✅ Seeding completed!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await client.end()
    process.exit(0)
  }
}

main()
