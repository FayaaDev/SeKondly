-- Backfill format field in cases table for existing cases
UPDATE cases
SET format = 'short'
WHERE format IS NULL;
