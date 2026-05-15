DO $$ BEGIN
 CREATE TYPE "todo_status" AS ENUM('todo', 'in_progress', 'waiting_review', 'done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "todo_category" AS ENUM('Pra-Training', 'Training', 'Pasca-Training', 'Sertifikat', 'Admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "todos" (
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
CREATE TABLE IF NOT EXISTS "tugas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_tugas" varchar(255) NOT NULL,
	"deskripsi" text,
	"tipe_output" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tugas_peserta" (
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
CREATE TABLE IF NOT EXISTS "tugas_peserta_upload" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tugas_peserta_id" uuid NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "todos" ADD CONSTRAINT "todos_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tugas_peserta" ADD CONSTRAINT "tugas_peserta_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tugas_peserta" ADD CONSTRAINT "tugas_peserta_tugas_id_tugas_id_fk" FOREIGN KEY ("tugas_id") REFERENCES "public"."tugas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tugas_peserta_upload" ADD CONSTRAINT "tugas_peserta_upload_tugas_peserta_id_tugas_peserta_id_fk" FOREIGN KEY ("tugas_peserta_id") REFERENCES "public"."tugas_peserta"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
