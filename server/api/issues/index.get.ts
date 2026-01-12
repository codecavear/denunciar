import { eq, desc } from 'drizzle-orm'
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

  let queryBuilder = db
    .select({
      issue: issues,
      entity: entities,
      user: users
    })
    .from(issues)
    .leftJoin(entities, eq(issues.entityId, entities.id))
    .leftJoin(users, eq(issues.userId, users.id))
    .where(eq(issues.userId, session.user.id))
    .orderBy(desc(issues.createdAt))

  if (status) {
    queryBuilder = queryBuilder.where(eq(issues.status, status as 'pending' | 'in_progress' | 'resolved' | 'closed'))
  }

  const result = await queryBuilder

  return result.map(({ issue, entity, user }) => ({
    ...issue,
    entity,
    user
  }))
})
