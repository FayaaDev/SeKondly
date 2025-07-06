-- Migration: Enable Case Approval Process
-- This migration changes the default for case approval from true to false
-- and updates existing approved cases to maintain their status

-- First, update the default for new cases
ALTER TABLE cases ALTER COLUMN is_approved SET DEFAULT FALSE;

-- Note: Existing cases remain unchanged as they are already approved
-- This ensures backwards compatibility while enabling approval for new cases

-- Add comment to document the change
COMMENT ON COLUMN cases.is_approved IS 'Cases require approval by administrators before being published (default: false)';
