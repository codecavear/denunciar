import { z } from 'zod'
import { getDb } from '../../utils/db'
import { entities } from '../../database/schema'

const createEntitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const validated = createEntitySchema.parse(body)

  const db = getDb()
  const [newEntity] = await db
    .insert(entities)
    .values({
      name: validated.name,
      description: validated.description,
      keywords: validated.keywords,
      contactEmail: validated.contactEmail
    })
    .returning()

  return newEntity
})
