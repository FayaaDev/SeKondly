-- Update the history field to be properly nullable
ALTER TABLE "cases" ALTER COLUMN "history" DROP NOT NULL;
