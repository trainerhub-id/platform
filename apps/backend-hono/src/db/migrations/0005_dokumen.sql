DO $$ BEGIN
 CREATE TYPE "dokumen_status" AS ENUM('pending', 'revisi', 'approved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dokumen_kategori" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dokumen_jenis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kategori_id" uuid NOT NULL,
	"nama_jenis" varchar(255) NOT NULL,
	"opsional" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dokumen_peserta" (
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
DO $$ BEGIN
 ALTER TABLE "dokumen_jenis" ADD CONSTRAINT "dokumen_jenis_kategori_id_dokumen_kategori_id_fk" FOREIGN KEY ("kategori_id") REFERENCES "public"."dokumen_kategori"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dokumen_peserta" ADD CONSTRAINT "dokumen_peserta_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dokumen_peserta" ADD CONSTRAINT "dokumen_peserta_jenis_id_dokumen_jenis_id_fk" FOREIGN KEY ("jenis_id") REFERENCES "public"."dokumen_jenis"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
