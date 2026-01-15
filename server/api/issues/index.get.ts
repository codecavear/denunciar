import { eq, desc, and, sql, count } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { issues, entities, users, issueConfirmations } from '../../database/schema'

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
      issue: {
        ...issues,
        // Cast decimal/numeric types to float for JSON safety
        latitude: sql<number>`CAST(${issues.latitude} AS FLOAT)`,
        longitude: sql<number>`CAST(${issues.longitude} AS FLOAT)`,
      },
      entity: entities,
      user: users,
      confirmationCount: count(issueConfirmations.id),
      userConfirmed: sql<boolean>`EXISTS (
        SELECT 1 FROM ${issueConfirmations} ic 
        WHERE ic.issue_id = ${issues.id} 
        AND ic.user_id = ${session.user.id}
      )`
    })
    .from(issues)
    .leftJoin(entities, eq(issues.entityId, entities.id))
    .leftJoin(users, eq(issues.userId, users.id))
    .leftJoin(issueConfirmations, eq(issues.id, issueConfirmations.issueId))
    .where(whereConditions)
    .groupBy(issues.id, entities.id, users.id)
    .orderBy(desc(issues.createdAt))

  return result.map(({ issue, entity, user, confirmationCount, userConfirmed }) => ({
    ...issue,
    entity,
    user,
    confirmationCount,
    userConfirmed
  }))
})
