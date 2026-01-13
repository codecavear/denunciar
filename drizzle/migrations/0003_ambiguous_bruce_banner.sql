CREATE TYPE "public"."issue_category" AS ENUM('pothole', 'trash', 'lighting', 'security', 'trees', 'water', 'infrastructure', 'other');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "category" "issue_category" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "issues" ADD COLUMN "moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL;