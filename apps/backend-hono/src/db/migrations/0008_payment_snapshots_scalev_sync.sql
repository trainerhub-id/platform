ALTER TABLE "batch_tiers" ADD COLUMN IF NOT EXISTS "scalev_sync_status" varchar(30) DEFAULT 'not_synced' NOT NULL;
--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN IF NOT EXISTS "scalev_last_synced_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN IF NOT EXISTS "scalev_sync_error" text;
--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN IF NOT EXISTS "batch_name_snapshot" varchar(255);
--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN IF NOT EXISTS "tier_name_snapshot" varchar(255);
