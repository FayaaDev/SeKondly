-- Make sure history is nullable and has a proper default
ALTER TABLE "cases" ALTER COLUMN "history" DROP NOT NULL;
ALTER TABLE "cases" ALTER COLUMN "history" SET DEFAULT NULL;
