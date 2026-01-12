import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { entities } from '../../database/schema'

const updateEntitySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional().nullable(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Entity ID is required' })
  }

  const body = await readBody(event)
  const validated = updateEntitySchema.parse(body)

  const db = getDb()
  const [updatedEntity] = await db
    .update(entities)
    .set({
      ...validated,
      updatedAt: new Date()
    })
    .where(eq(entities.id, id))
    .returning()

  if (!updatedEntity) {
    throw createError({ statusCode: 404, message: 'Entity not found' })
  }

  return updatedEntity
})
