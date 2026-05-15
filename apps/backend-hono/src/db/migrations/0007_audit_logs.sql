CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text,
	"actor_email" varchar(255),
	"actor_name" varchar(255),
	"action" varchar(120) NOT NULL,
	"entity_type" varchar(80) NOT NULL,
	"entity_id" text NOT NULL,
	"batch_id" uuid,
	"enrollment_id" uuid,
	"peserta_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb,
	"request_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_enrollment_id_peserta_batch_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."peserta_batch"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
