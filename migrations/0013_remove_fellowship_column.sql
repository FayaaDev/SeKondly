-- Remove fellowship column as fellowships are now merged into medical specialties
ALTER TABLE "users" DROP COLUMN IF EXISTS "fellowship";
