DO $$ BEGIN
 ALTER TABLE "entities" ADD COLUMN "icon" text DEFAULT 'i-lucide-alert-circle';
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;