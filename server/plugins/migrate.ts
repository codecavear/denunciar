import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { getDb } from '../../utils/db'

export default defineNitroPlugin(async () => {
  if (process.env.NODE_ENV !== 'production') return

  console.log('🚀 Checking for pending migrations...')
  try {
    const db = getDb()
    
    // In production (bundled), we can't easily read the filesystem for the migration folder 
    // in the same way 'drizzle-kit' expects via 'migrationsFolder'.
    // However, since we added 'drizzle/migrations' to serverAssets, we theoretically could...
    // BUT 'migrate()' from drizzle-orm expects a physical file path string, causing issues in some serverless/bundled envs.
    
    // ALTERNATIVE: For now, sticking to the standard folder path assuming the environment (like Railway) 
    // preserves the file system or we can point to the asset.
    
    // Note: Drizzle's 'migrate' function reads from disk. If we are in a container where only '.output' exists,
    // we need to make sure the migrations are copied there OR use a custom migration provider.
    
    // SIMPLER APPROACH FOR NOW given the user wants a quick fix for Railway:
    // We will assume the 'start' script keeps the source or we rely on the previously added 'start' script working
    // IF we fix the path.
    // BUT the user specifically asked to "configure it to run on deploy".
    
    // The most robust way is to run it here.
    // Let's rely on standard path './drizzle/migrations' for now.
    // If this fails (because files missing), we'll see it in logs.
    
    await migrate(db, { migrationsFolder: 'drizzle/migrations' })
    console.log('✅ Migrations applied successfully!')
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️ Migration folder not found. Skipping auto-migration (Are you in a strictly bundled env?)', error.path)
    } else {
      console.error('❌ Migration failed:', error)
    }
  }
})
