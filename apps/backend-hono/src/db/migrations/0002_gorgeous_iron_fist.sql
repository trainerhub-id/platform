CREATE TABLE "document_payload_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"flow" text NOT NULL,
	"document_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"schema_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generated_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"generation_job_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"output_format" text NOT NULL,
	"file_path" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer,
	"checksum" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"boss_job_id" text,
	"job_type" text NOT NULL,
	"request_key" text NOT NULL,
	"status" text NOT NULL,
	"input" jsonb NOT NULL,
	"error" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_payload_snapshots" ADD CONSTRAINT "document_payload_snapshots_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_files" ADD CONSTRAINT "generated_files_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generated_files" ADD CONSTRAINT "generated_files_generation_job_id_generation_jobs_id_fk" FOREIGN KEY ("generation_job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_payload_snapshots_document_type_created_idx" ON "document_payload_snapshots" USING btree ("document_id","document_type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "document_payload_snapshots_document_type_hash_unique_idx" ON "document_payload_snapshots" USING btree ("document_id","document_type","payload_hash");--> statement-breakpoint
CREATE INDEX "generated_files_document_created_idx" ON "generated_files" USING btree ("document_id","created_at");--> statement-breakpoint
CREATE INDEX "generated_files_generation_job_idx" ON "generated_files" USING btree ("generation_job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "generation_jobs_job_request_unique_idx" ON "generation_jobs" USING btree ("job_type","request_key");--> statement-breakpoint
CREATE INDEX "generation_jobs_document_created_idx" ON "generation_jobs" USING btree ("document_id","created_at");