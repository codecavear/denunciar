import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables
config()

const runMigration = async () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined')
    }

    const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 })
    const db = drizzle(migrationClient)

    console.log('⏳ Running migrations...')

    await migrate(db, { migrationsFolder: './drizzle/migrations' })

    console.log('✅ Migrations completed successfully')

    await migrationClient.end()
}

runMigration().catch((err) => {
    console.error('❌ Migration failed')
    console.error(err)
    process.exit(1)
})
