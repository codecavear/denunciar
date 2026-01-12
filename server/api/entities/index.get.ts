import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { entities } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = getDb()
  const allEntities = await db
    .select()
    .from(entities)
    .where(eq(entities.isActive, true))
    .orderBy(entities.name)

  return allEntities
})
