CREATE TYPE "public"."dokumen_status" AS ENUM('pending', 'revisi', 'approved');--> statement-breakpoint
CREATE TYPE "public"."todo_category" AS ENUM('Pra-Training', 'Training', 'Pasca-Training', 'Sertifikat', 'Admin');--> statement-breakpoint
CREATE TYPE "public"."todo_status" AS ENUM('todo', 'in_progress', 'waiting_review', 'done');--> statement-breakpoint
CREATE TABLE "audit_logs" (
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
CREATE TABLE "dokumen_jenis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kategori_id" uuid NOT NULL,
	"nama_jenis" varchar(255) NOT NULL,
	"opsional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dokumen_kategori" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dokumen_peserta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peserta_id" uuid NOT NULL,
	"jenis_id" uuid NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"status" "dokumen_status" DEFAULT 'pending' NOT NULL,
	"catatan_revisi" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"batch_id" uuid,
	"key" text NOT NULL,
	"title" text NOT NULL,
	"category" "todo_category" NOT NULL,
	"status" "todo_status" DEFAULT 'todo' NOT NULL,
	"is_blocking" boolean DEFAULT false,
	"meta" json,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tugas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_tugas" varchar(255) NOT NULL,
	"deskripsi" text,
	"tipe_output" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tugas_peserta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peserta_id" uuid NOT NULL,
	"tugas_id" uuid NOT NULL,
	"status" varchar(50),
	"nilai" varchar(10),
	"catatan_trainer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tugas_peserta_upload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tugas_peserta_id" uuid NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN "scalev_sync_status" varchar(30) DEFAULT 'not_synced' NOT NULL;--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN "scalev_last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD COLUMN "scalev_sync_error" text;--> statement-breakpoint
ALTER TABLE "batch_training" ADD COLUMN "batch_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN "enrollment_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN "batch_name_snapshot" varchar(255);--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD COLUMN "tier_name_snapshot" varchar(255);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "short_code" varchar(30) NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_enrollment_id_peserta_batch_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."peserta_batch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dokumen_jenis" ADD CONSTRAINT "dokumen_jenis_kategori_id_dokumen_kategori_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."dokumen_kategori"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dokumen_peserta" ADD CONSTRAINT "dokumen_peserta_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dokumen_peserta" ADD CONSTRAINT "dokumen_peserta_jenis_id_dokumen_jenis_id_fk" FOREIGN KEY ("jenis_id") REFERENCES "public"."dokumen_jenis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tugas_peserta" ADD CONSTRAINT "tugas_peserta_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tugas_peserta" ADD CONSTRAINT "tugas_peserta_tugas_id_tugas_id_fk" FOREIGN KEY ("tugas_id") REFERENCES "public"."tugas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tugas_peserta_upload" ADD CONSTRAINT "tugas_peserta_upload_tugas_peserta_id_tugas_peserta_id_fk" FOREIGN KEY ("tugas_peserta_id") REFERENCES "public"."tugas_peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_enrollment_id_peserta_batch_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."peserta_batch"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "batch_training_course_batch_number_unique" ON "batch_training" USING btree ("course_id","batch_number");--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_short_code_unique" UNIQUE("short_code");