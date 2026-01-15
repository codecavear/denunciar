
import { sql } from 'drizzle-orm'
import { getDb } from '../server/utils/db'

async function main() {
  const db = getDb()
  console.log('Running manual migration 0004...')

  try {
    // 1. Create Resolution Status Enum (Safe create)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."resolution_status" AS ENUM('pending', 'accepted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    console.log('✔ Enum resolution_status created (or existed)')

    // 2. Create Resolutions Table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "resolutions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "issue_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "image_url" text NOT NULL,
        "status" "resolution_status" DEFAULT 'pending' NOT NULL,
        "reasoning" text,
        "votes_for" numeric DEFAULT '0' NOT NULL,
        "votes_against" numeric DEFAULT '0' NOT NULL,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `)
    console.log('✔ Table resolutions created')

    // 3. Create User Stats Table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_stats" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "reputation_score" numeric DEFAULT '0' NOT NULL,
        "reports_created" numeric DEFAULT '0' NOT NULL,
        "reports_verified" numeric DEFAULT '0' NOT NULL,
        "category_scores" jsonb DEFAULT '{}'::jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "user_stats_user_id_unique" UNIQUE("user_id")
      );
    `)
    console.log('✔ Table user_stats created')

    // 4. Add Constraints (Check existence first implicitly via exception handling or IF NOT EXISTS logic if possible, 
    // but standard generic constraint addition usually fails if exists. We wrap in try/catch blocks for safety.)

    try {
        await db.execute(sql`ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;`)
        console.log('✔ Constraint resolutions_issue_id_issues_id_fk added')
    } catch (e: any) {
        if (e.code === '42710') console.log('✔ Constraint resolutions_issue_id_issues_id_fk already exists') // duplicate_object
        else throw e
    }

    try {
        await db.execute(sql`ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`)
        console.log('✔ Constraint resolutions_user_id_users_id_fk added')
    } catch (e: any) {
        if (e.code === '42710') console.log('✔ Constraint resolutions_user_id_users_id_fk already exists')
        else throw e
    }

    try {
        await db.execute(sql`ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;`)
        console.log('✔ Constraint user_stats_user_id_users_id_fk added')
    } catch (e: any) {
        if (e.code === '42710') console.log('✔ Constraint user_stats_user_id_users_id_fk already exists')
        else throw e
    }

    console.log('Done.')
    process.exit(0)
  } catch (e) {
    console.error('Migration execution failed:', e)
    process.exit(1)
  }
}

main()
