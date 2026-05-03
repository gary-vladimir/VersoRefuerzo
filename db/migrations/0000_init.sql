CREATE TABLE "bible_text_cache" (
	"canonical_ref" text NOT NULL,
	"version" text NOT NULL,
	"text" text NOT NULL,
	"copyright_attribution" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bible_text_cache_canonical_ref_version_pk" PRIMARY KEY("canonical_ref","version")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"photo_url" text,
	"locale" text DEFAULT 'es' NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"last_version" text,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"has_seen_aloud_tip" boolean DEFAULT false NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_streak_at" date,
	"timezone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_collections" (
	"verse_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	CONSTRAINT "verse_collections_verse_id_collection_id_pk" PRIMARY KEY("verse_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "verses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"canonical_ref" text NOT NULL,
	"version" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"hint" text,
	"srs_state" jsonb DEFAULT '{"easeFactor":2.5,"interval":0,"repetitions":0,"dueAt":"1970-01-01T00:00:00.000Z","chunkStage":0}'::jsonb NOT NULL,
	"mastery" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_collections" ADD CONSTRAINT "verse_collections_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_collections" ADD CONSTRAINT "verse_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verses" ADD CONSTRAINT "verses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collections_user_idx" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_user_name_uniq" ON "collections" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_sub_idx" ON "users" USING btree ("google_sub");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verse_collections_collection_idx" ON "verse_collections" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "verses_user_deleted_idx" ON "verses" USING btree ("user_id","deleted_at");--> statement-breakpoint
CREATE INDEX "verses_ref_ver_idx" ON "verses" USING btree ("canonical_ref","version");