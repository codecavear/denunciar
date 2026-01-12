import { z } from 'zod'
import { getDb } from '../../utils/db'
import { issues } from '../../database/schema'

const createIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().optional(),
  entityId: z.string().uuid().optional(),
  aiConfidence: z.number().min(0).max(1).optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const validated = createIssueSchema.parse(body)

  const db = getDb()
  const [newIssue] = await db
    .insert(issues)
    .values({
      userId: session.user.id,
      title: validated.title,
      description: validated.description,
      imageUrl: validated.imageUrl,
      imagePublicId: validated.imagePublicId,
      latitude: validated.latitude?.toString(),
      longitude: validated.longitude?.toString(),
      address: validated.address,
      entityId: validated.entityId,
      aiConfidence: validated.aiConfidence?.toString(),
      status: 'pending'
    })
    .returning()

  return newIssue
})
