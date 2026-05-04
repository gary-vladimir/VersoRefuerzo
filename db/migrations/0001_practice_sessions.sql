CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"verse_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"classification" text NOT NULL,
	"quality" integer,
	"outcome" text NOT NULL,
	"duration_ms" integer DEFAULT 0 NOT NULL,
	"used_hint" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_verse_id_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."verses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_sessions_user_started_idx" ON "practice_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "practice_sessions_user_verse_mode_idx" ON "practice_sessions" USING btree ("user_id","verse_id","mode","started_at");
