CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"user_id" text NOT NULL,
	"peserta_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_peserta_id_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_enrollment_id_peserta_batch_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."peserta_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_batch_id_batch_training_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch_training"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_user_slug_unique" ON "workspaces" USING btree ("user_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_enrollment_unique" ON "workspaces" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "workspaces_user_status_idx" ON "workspaces" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "workspaces_batch_idx" ON "workspaces" USING btree ("batch_id");