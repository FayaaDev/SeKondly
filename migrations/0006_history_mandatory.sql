-- Make history field mandatory for all cases
ALTER TABLE "cases" ALTER COLUMN "history" SET NOT NULL;
