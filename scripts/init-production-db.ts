import { sql } from 'drizzle-orm'
import { getDb } from '../server/utils/db'

/**
 * Script de inicialización para Railway
 * Crea las tablas gamification si no existen
 */
async function initProductionDb() {
  const db = getDb()
  
  console.log('🚀 Inicializando tablas de gamificación...')

  try {
    // 1. Crear ENUM resolution_status si no existe
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."resolution_status" AS ENUM('pending', 'accepted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'Type resolution_status already exists, skipping.';
      END $$;
    `)
    console.log('✅ ENUM resolution_status OK')

    // 2. Crear tabla resolutions si no existe
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
    console.log('✅ Tabla resolutions OK')

    // 3. Crear tabla user_stats si no existe
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
    console.log('✅ Tabla user_stats OK')

    // 4. Agregar constraints si no existen
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_issue_id_issues_id_fk" 
          FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'FK resolutions_issue_id already exists, skipping.';
      END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'FK resolutions_user_id already exists, skipping.';
      END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" 
          FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN 
          RAISE NOTICE 'FK user_stats_user_id already exists, skipping.';
      END $$;
    `)
    console.log('✅ Constraints OK')

    console.log('🎉 Inicialización completada exitosamente!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error durante inicialización:', error)
    process.exit(1)
  }
}

initProductionDb()
