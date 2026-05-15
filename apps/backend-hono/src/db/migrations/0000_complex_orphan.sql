CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_field_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"flow" text NOT NULL,
	"phase_key" text NOT NULL,
	"field_key" text NOT NULL,
	"value" jsonb,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"confidence" numeric,
	"evidence_message_id" uuid,
	"pending_suggestion" jsonb,
	"rejection_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_master_profiles" (
	"document_id" uuid PRIMARY KEY NOT NULL,
	"organization_name" text,
	"trainer_name" text,
	"organization_city" text,
	"organization_focus" text,
	"program_name" text,
	"program_goal" text,
	"target_participants" text,
	"industry_problem" text,
	"training_location" text,
	"training_duration" text,
	"delivery_method" text,
	"evaluation_methods" text,
	"selected_unit_code" text,
	"selected_unit_title" text,
	"selected_unit_source" text,
	"skkni_map_ready" boolean DEFAULT false NOT NULL,
	"unit_detail_ready" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_trainer_profiles" (
	"document_id" uuid PRIMARY KEY NOT NULL,
	"trainer_name" text,
	"expertise" text,
	"activities" text,
	"audience" text,
	"outcome" text,
	"training_objective" text,
	"training_date" text,
	"institution" text,
	"selected_unit_code" text,
	"selected_unit_title" text,
	"program_name" text,
	"delivery_method" text,
	"duration_jp" integer,
	"unit_detail_ready" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text NOT NULL,
	"flow" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_phase" text DEFAULT 'profile' NOT NULL,
	"schema_version" text DEFAULT 'hono_alpha_v1' NOT NULL,
	"master_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"readiness" jsonb DEFAULT '{"ready":false,"missing":[]}'::jsonb NOT NULL,
	"generation_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_field_states" ADD CONSTRAINT "document_field_states_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_master_profiles" ADD CONSTRAINT "document_master_profiles_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_trainer_profiles" ADD CONSTRAINT "document_trainer_profiles_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "document_field_states_document_id_idx" ON "document_field_states" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_field_states_unique_idx" ON "document_field_states" USING btree ("document_id","flow","phase_key","field_key");--> statement-breakpoint
CREATE INDEX "documents_owner_updated_idx" ON "documents" USING btree ("owner_user_id","updated_at");--> statement-breakpoint
CREATE INDEX "documents_flow_status_idx" ON "documents" USING btree ("flow","status");