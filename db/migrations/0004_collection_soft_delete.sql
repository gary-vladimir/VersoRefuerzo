ALTER TABLE "collections" ADD COLUMN "deleted_at" timestamp with time zone;
CREATE INDEX "collections_user_deleted_idx" ON "collections" ("user_id","deleted_at");
