import { eq, desc, and } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { issues, entities, users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const status = query.status as string | undefined

  const db = getDb()

  // Build the where conditions
  const whereConditions = status
    ? and(
        eq(issues.userId, session.user.id),
        eq(issues.status, status as 'pending' | 'in_progress' | 'resolved' | 'closed')
      )
    : eq(issues.userId, session.user.id)

  const result = await db
    .select({
      issue: issues,
      entity: entities,
      user: users
    })
    .from(issues)
    .leftJoin(entities, eq(issues.entityId, entities.id))
    .leftJoin(users, eq(issues.userId, users.id))
    .where(whereConditions)
    .orderBy(desc(issues.createdAt))

  return result.map(({ issue, entity, user }) => ({
    ...issue,
    entity,
    user
  }))
})
