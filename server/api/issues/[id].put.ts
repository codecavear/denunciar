import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { issues } from '../../database/schema'

const updateIssueSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  address: z.string().optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Issue ID is required' })
  }

  const body = await readBody(event)
  const validated = updateIssueSchema.parse(body)

  const db = getDb()

  const updateData: Record<string, unknown> = {
    updatedAt: new Date()
  }

  if (validated.title !== undefined) updateData.title = validated.title
  if (validated.description !== undefined) updateData.description = validated.description
  if (validated.imageUrl !== undefined) updateData.imageUrl = validated.imageUrl
  if (validated.imagePublicId !== undefined) updateData.imagePublicId = validated.imagePublicId
  if (validated.latitude !== undefined) updateData.latitude = validated.latitude?.toString()
  if (validated.longitude !== undefined) updateData.longitude = validated.longitude?.toString()
  if (validated.address !== undefined) updateData.address = validated.address
  if (validated.entityId !== undefined) updateData.entityId = validated.entityId
  if (validated.status !== undefined) updateData.status = validated.status

  const [updatedIssue] = await db
    .update(issues)
    .set(updateData)
    .where(and(
      eq(issues.id, id),
      eq(issues.userId, session.user.id)
    ))
    .returning()

  if (!updatedIssue) {
    throw createError({ statusCode: 404, message: 'Issue not found' })
  }

  return updatedIssue
})
