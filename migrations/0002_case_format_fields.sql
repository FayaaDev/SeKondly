-- Add case format fields
ALTER TABLE cases 
ADD COLUMN format varchar DEFAULT 'short' NOT NULL,
ADD COLUMN chief_complaint text,
ADD COLUMN history_of_present_illness text,
ADD COLUMN past_medical_history text,
ADD COLUMN family_history text,
ADD COLUMN drug_history text,
ADD COLUMN systemic_review text,
ADD COLUMN examination text,
ADD COLUMN management text;
