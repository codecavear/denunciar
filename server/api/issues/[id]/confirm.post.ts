import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '../../../utils/db'
import { issueConfirmations, issues } from '../../../database/schema'
import { GamificationService } from '../../../utils/gamification'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const issueId = getRouterParam(event, 'id')
  if (!issueId) {
    throw createError({ statusCode: 400, message: 'Issue ID is required' })
  }

  const db = getDb()

  // Check if issue exists
  const [issue] = await db
    .select()
    .from(issues)
    .where(eq(issues.id, issueId))
    .limit(1)

  if (!issue) {
    throw createError({ statusCode: 404, message: 'Issue not found' })
  }

  // Check if user already confirmed
  const existing = await db
    .select()
    .from(issueConfirmations)
    .where(and(
      eq(issueConfirmations.issueId, issueId),
      eq(issueConfirmations.userId, session.user.id)
    ))
    .limit(1)

  if (existing.length > 0) {
    // Remove confirmation (toggle off)
    await db
      .delete(issueConfirmations)
      .where(and(
        eq(issueConfirmations.issueId, issueId),
        eq(issueConfirmations.userId, session.user.id)
      ))

    return { confirmed: false }
  }

  // Add confirmation
  await db.insert(issueConfirmations).values({
    issueId,
    userId: session.user.id
  })

  // Check new confirmation count
  const [{ count: newCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(issueConfirmations)
      .where(eq(issueConfirmations.issueId, issueId))
  
  // Hardcoded threshold for now, matching the one in shared/constants if we could import it shared
  // Ideally this should be imported from shared/constants - but for backend we can just define it
  const THRESHOLD = 5 

  if (newCount === THRESHOLD) {
    try {
        await GamificationService.onIssueVerified(issue.userId)
    } catch (e) {
        console.error('Gamification Verification Error:', e)
    }
  }
  
  // Award simple participation point for confirming?
  // Design says: "+1 (If issue eventually Verified)"
  // So we don't award it immediately. We would need a batch job or logic to backfill confirmers when verified.
  // For MVP: We are keeping it simple. Maybe just award +1 for "Helpful" confirmation immediately? 
  // gamification_design.md says: "+1 (If issue eventually Verified)"
  // So we should strictly probably do that in onIssueVerified.
  // Let's modify GamificationService.onIssueVerified to reward confirmers too.

  return { confirmed: true }
})
