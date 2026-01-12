import { eq, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { issues, entities, users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Issue ID is required' })
  }

  const db = getDb()
  const [result] = await db
    .select({
      issue: issues,
      entity: entities,
      user: users
    })
    .from(issues)
    .leftJoin(entities, eq(issues.entityId, entities.id))
    .leftJoin(users, eq(issues.userId, users.id))
    .where(and(
      eq(issues.id, id),
      eq(issues.userId, session.user.id)
    ))
    .limit(1)

  if (!result) {
    throw createError({ statusCode: 404, message: 'Issue not found' })
  }

  return {
    ...result.issue,
    entity: result.entity,
    user: result.user
  }
})
