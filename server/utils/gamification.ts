import { sql, eq, and, gt } from 'drizzle-orm'
import { getDb } from './db'
import { users, userStats, type UserStat, type User } from '../database/schema'
import { TIERS } from '../../shared/constants'

export const POINTS = {
  CREATE_REPORT: 1,
  REPORT_VERIFIED_CREATOR: 5,
  CONFIRM_VERIFIED_ISSUE: 1, // Reward for confirming an issue that becomes verified
  VALIDATE_FIX: 2,
  FAKE_REPORT_PENALTY: -10
}

export class GamificationService {
  
  /**
   * Awards points to a user and updates their tier.
   */
  static async awardPoints(userId: string, points: number) {
    const db = getDb()
    
    // Ensure stats record exists
    const [stats] = await db
      .insert(userStats)
      .values({
        userId,
        reputationScore: points.toString(), // Initial score if new
        reportsCreated: '0',
        reportsVerified: '0'
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          reputationScore: sql`${userStats.reputationScore} + ${points}`,
          updatedAt: new Date()
        }
      })
      .returning()
    
    return stats
  }

  /**
   * Gets the user's current tier based on their reputation score.
   */
  static getTier(score: number) {
    if (score >= TIERS.GUARDIAN.min) return TIERS.GUARDIAN
    if (score >= TIERS.CITIZEN.min) return TIERS.CITIZEN
    return TIERS.NEWBIE
  }

  /**
   * Increments the 'reportsCreated' counter for a user.
   * Optionally awards valid creation points (if we decide to give points immediately).
   */
  static async incrementReportsCreated(userId: string) {
    const db = getDb()
    
    await db
      .insert(userStats)
      .values({
        userId,
        reputationScore: '0',
        reportsCreated: '1',
        reportsVerified: '0'
      })
      .onConflictDoUpdate({
        target: userStats.userId,
        set: {
          reportsCreated: sql`${userStats.reportsCreated} + 1`,
          updatedAt: new Date()
        }
      })
  }

  /**
   * Called when an issue reaches the confirmation threshold.
   * Awards points to the Creator and potentially the Confirmers.
   */
  static async onIssueVerified(creatorId: string) {
    const db = getDb()

    // 1. Award Creator
    await this.awardPoints(creatorId, POINTS.REPORT_VERIFIED_CREATOR)

    // 2. Increment verified count
    await db
      .update(userStats)
      .set({ 
        reportsVerified: sql`${userStats.reportsVerified} + 1`,
        updatedAt: new Date()
      })
      .where(eq(userStats.userId, creatorId))
  }
}
