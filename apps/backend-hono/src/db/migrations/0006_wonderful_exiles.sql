CREATE TABLE "dokumen_jenis_program" (
	"jenis_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dokumen_jenis_program_jenis_id_course_id_pk" PRIMARY KEY("jenis_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "dokumen_peserta" ADD COLUMN "workspace_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "dokumen_jenis_program" ADD CONSTRAINT "dokumen_jenis_program_jenis_id_dokumen_jenis_id_fk" FOREIGN KEY ("jenis_id") REFERENCES "public"."dokumen_jenis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dokumen_jenis_program" ADD CONSTRAINT "dokumen_jenis_program_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dokumen_peserta" ADD CONSTRAINT "dokumen_peserta_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;