CREATE UNIQUE INDEX IF NOT EXISTS "todos_user_id_key_unique_idx" ON "todos" ("user_id", "key") WHERE "user_id" IS NOT NULL;
