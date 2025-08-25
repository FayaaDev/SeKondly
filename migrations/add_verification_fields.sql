-- Add verification fields to cases table
-- Migration: Add AI verification fields to support Google Cloud Vision + DLP verification

-- Add verification status field
ALTER TABLE cases 
ADD COLUMN verification_status VARCHAR CHECK (verification_status IN ('pending', 'verified', 'flagged', 'failed')) DEFAULT 'pending';

-- Add verification confidence score (0-100)
ALTER TABLE cases 
ADD COLUMN verification_confidence INTEGER DEFAULT 0;

-- Add flag for manual review requirement
ALTER TABLE cases 
ADD COLUMN requires_manual_review BOOLEAN DEFAULT false;

-- Add number of violations found
ALTER TABLE cases 
ADD COLUMN verification_violations INTEGER DEFAULT 0;

-- Add timestamp of verification
ALTER TABLE cases 
ADD COLUMN verification_timestamp TIMESTAMP;

-- Add JSON field for detailed violation summary
ALTER TABLE cases 
ADD COLUMN verification_summary JSONB;

-- Add text field for admin notes after manual review
ALTER TABLE cases 
ADD COLUMN verification_notes TEXT;

-- Create index on verification_status for faster queries
CREATE INDEX idx_cases_verification_status ON cases(verification_status);

-- Create index on requires_manual_review for admin filtering
CREATE INDEX idx_cases_manual_review ON cases(requires_manual_review);

-- Create index on verification_confidence for filtering by quality
CREATE INDEX idx_cases_verification_confidence ON cases(verification_confidence);

-- Update existing cases to have 'pending' verification status
UPDATE cases 
SET verification_status = 'pending', 
    verification_confidence = 0,
    requires_manual_review = false,
    verification_violations = 0
WHERE verification_status IS NULL;
