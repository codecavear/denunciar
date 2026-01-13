import { z } from 'zod'
import { getDb } from '../../utils/db'
import { issues } from '../../database/schema'

const createIssueSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  imageUrl: z.string().url().nullable().optional(),
  imagePublicId: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  address: z.string().nullable().optional(),
  entityId: z.string().uuid().nullable().optional(),
  category: z.enum(['pothole', 'trash', 'lighting', 'safety', 'water', 'infrastructure', 'other']).default('other'),
  aiConfidence: z.number().min(0).max(1).nullable().optional()
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
      category: validated.category,
      moderationStatus: 'approved', // Auto-approve for now, can be changed later based on logic
      aiConfidence: validated.aiConfidence?.toString(),
      status: 'pending'
    })
    .returning()

  return newIssue
})
