ALTER TABLE "batch_tiers" ADD COLUMN IF NOT EXISTS "scalev_sync_status" varchar(30) DEFAULT 'not_synced' NOT NULL;
--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN IF NOT EXISTS "scalev_last_synced_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN IF NOT EXISTS "scalev_sync_error" text;
--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN IF NOT EXISTS "batch_name_snapshot" varchar(255);
--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN IF NOT EXISTS "tier_name_snapshot" varchar(255);
--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN IF NOT EXISTS "enrollment_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_enrollment_id_peserta_batch_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."peserta_batch"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
