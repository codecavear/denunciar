CREATE TYPE "public"."issue_category" AS ENUM('pothole', 'trash', 'lighting', 'safety', 'water', 'infrastructure', 'other');
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');
ALTER TABLE "issues" ADD COLUMN "category" "issue_category" DEFAULT 'other' NOT NULL;
ALTER TABLE "issues" ADD COLUMN "moderation_status" "moderation_status" DEFAULT 'approved' NOT NULL;
