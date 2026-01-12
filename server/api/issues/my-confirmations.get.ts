import { eq } from 'drizzle-orm'
import { getDb } from '../../utils/db'
import { issueConfirmations } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    return []
  }

  const db = getDb()

  const confirmations = await db
    .select({ issueId: issueConfirmations.issueId })
    .from(issueConfirmations)
    .where(eq(issueConfirmations.userId, session.user.id))

  return confirmations.map(c => c.issueId)
})
