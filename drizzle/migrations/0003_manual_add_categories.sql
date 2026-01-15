DO $$ BEGIN
 CREATE TYPE "public"."issue_category" AS ENUM('pothole', 'trash', 'lighting', 'safety', 'water', 'infrastructure', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "issues" ADD COLUMN "category" "issue_category" DEFAULT 'other' NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "issues" ADD COLUMN "moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
