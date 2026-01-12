import { sql, ne } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { issues, entities, users, issueConfirmations } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bounds = query.bounds as string | undefined

  const db = getDb()

  // Get all non-closed issues with confirmation count
  const result = await db
    .select({
      issue: issues,
      entity: entities,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl
      },
      confirmationCount: sql<number>`(
        SELECT COUNT(*)::int FROM issue_confirmations
        WHERE issue_confirmations.issue_id = ${issues.id}
      )`
    })
    .from(issues)
    .leftJoin(entities, sql`${issues.entityId} = ${entities.id}`)
    .leftJoin(users, sql`${issues.userId} = ${users.id}`)
    .where(ne(issues.status, 'closed'))

  return result.map(({ issue, entity, user, confirmationCount }) => ({
    ...issue,
    entity,
    user,
    confirmationCount: confirmationCount || 0
  }))
})
