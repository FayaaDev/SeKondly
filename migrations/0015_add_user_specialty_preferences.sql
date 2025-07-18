-- Add user_specialty_preferences column to users table
ALTER TABLE "users" ADD COLUMN "user_specialty_preferences" text[];

-- Create index for better performance on specialty preferences queries
CREATE INDEX IF NOT EXISTS "idx_users_specialty_preferences" ON "users" USING GIN("user_specialty_preferences");
