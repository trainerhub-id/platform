CREATE TYPE "public"."certificate_status" AS ENUM('not_submitted', 'in_review', 'approved', 'rejected', 'issued');--> statement-breakpoint
CREATE TYPE "public"."certificate_type" AS ENUM('bnsp', 'trainerhub');--> statement-breakpoint
CREATE TYPE "public"."jk" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'unpaid', 'pending', 'cancel');--> statement-breakpoint
CREATE TABLE "batch_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"tier_template_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"price" integer DEFAULT 0 NOT NULL,
	"max_participants" integer,
	"course_ids" jsonb,
	"ai_features" jsonb,
	"benefits" jsonb,
	"scalev_store_unique_id" text,
	"scalev_variant_unique_id" text,
	"scalev_bundle_price_option_unique_id" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_training" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama_batch" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"tanggal" timestamp with time zone NOT NULL,
	"tanggal_selesai" timestamp with time zone,
	"hotel" varchar(255),
	"alamat" text,
	"maps_link" text,
	"image_url" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"rundown_template_id" integer,
	"course_id" uuid,
	"trainer_id" uuid,
	"latitude" numeric,
	"longitude" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batch_training_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"whatsapp" varchar(20),
	"batch_id" uuid,
	"tier_id" uuid,
	"peserta_id" uuid,
	"name" varchar(255),
	"xendit_session_id" varchar(255),
	"xendit_payment_link_url" text,
	"xendit_reference_id" varchar(255),
	"provider" varchar(50) DEFAULT 'scalev' NOT NULL,
	"provider_order_id" integer,
	"provider_order_code" varchar(255),
	"provider_reference_id" varchar(255),
	"provider_payment_method" varchar(50),
	"provider_sub_payment_method" varchar(50),
	"provider_checkout_url" text,
	"provider_qr_string" text,
	"provider_va_number" varchar(255),
	"provider_expires_at" timestamp with time zone,
	"provider_payload" jsonb,
	"clerk_user_id" varchar(255),
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'IDR' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"claim_token" text,
	"claim_token_used" boolean DEFAULT false NOT NULL,
	"clerk_sign_in_token" text,
	"clerk_token_expiry" timestamp with time zone,
	"payment_url" text,
	"reference_id" text,
	"expired_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peserta_batch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peserta_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"tier_id" uuid,
	"status" varchar(50) DEFAULT 'registered' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tier_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"default_course_ids" jsonb,
	"default_ai_features" jsonb,
	"default_benefits" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tier_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "trainer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nama" varchar(255) NOT NULL,
	"email" varchar(255),
	"foto_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sertifikat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peserta_id" uuid NOT NULL,
	"course_id" uuid,
	"type" "certificate_type" DEFAULT 'trainerhub' NOT NULL,
	"status" "certificate_status" DEFAULT 'issued' NOT NULL,
	"certificate_number" varchar(100),
	"course_name" varchar(255),
	"peserta_name" varchar(255),
	"completed_at" timestamp with time zone,
	"nomor_sertifikat" varchar(100),
	"file_url" varchar(500),
	"lsp" varchar(255),
	"issued_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sertifikat_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"total_chapters" integer DEFAULT 0,
	"is_active" integer DEFAULT 1,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"duration" varchar(20),
	"description" text,
	"video_url" text,
	"video_type" varchar(20) DEFAULT 'youtube',
	"mux_upload_id" text,
	"mux_asset_id" text,
	"mux_playback_id" text,
	"thumbnail_url" text,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "peserta_course_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"peserta_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'belum-mulai' NOT NULL,
	"video_progress" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "peserta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"nama" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"no_wa" varchar(20),
	"nik" varchar(16),
	"ttl" varchar(100),
	"jk" "jk",
	"alamat" text,
	"kota" varchar(100),
	"provinsi" varchar(100),
	"pendidikan" varchar(100),
	"pekerjaan" varchar(100),
	"t_shirt_size" varchar(10),
	"payment_status" "payment_status" DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "peserta_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "peserta_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD CONSTRAINT "batch_tiers_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_tiers" ADD CONSTRAINT "batch_tiers_tier_template_id_tier_templates_id_fk" FOREIGN KEY ("tier_template_id") REFERENCES "public"."tier_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_training" ADD CONSTRAINT "batch_training_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_training" ADD CONSTRAINT "batch_training_trainer_id_trainer_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_tier_id_batch_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."batch_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta_batch" ADD CONSTRAINT "peserta_batch_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta_batch" ADD CONSTRAINT "peserta_batch_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta_batch" ADD CONSTRAINT "peserta_batch_tier_id_batch_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."batch_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sertifikat" ADD CONSTRAINT "sertifikat_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sertifikat" ADD CONSTRAINT "sertifikat_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta_course_progress" ADD CONSTRAINT "peserta_course_progress_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peserta_course_progress" ADD CONSTRAINT "peserta_course_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;