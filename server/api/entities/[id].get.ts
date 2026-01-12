import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { entities } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Entity ID is required' })
  }

  const db = getDb()
  const [entity] = await db
    .select()
    .from(entities)
    .where(eq(entities.id, id))
    .limit(1)

  if (!entity) {
    throw createError({ statusCode: 404, message: 'Entity not found' })
  }

  return entity
})
