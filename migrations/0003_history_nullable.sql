-- Make history column nullable
ALTER TABLE cases ALTER COLUMN history DROP NOT NULL;
