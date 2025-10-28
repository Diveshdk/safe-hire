-- Enhanced jobs table for better job posting functionality
-- This script adds additional columns needed for comprehensive job postings

-- Add missing columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS employment_type TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS salary_range TEXT,
ADD COLUMN IF NOT EXISTS requirements TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;

-- Add check constraints for employment_type 
ALTER TABLE jobs 
ADD CONSTRAINT jobs_employment_type_check 
CHECK (employment_type IS NULL OR employment_type = ANY (ARRAY[
  'full-time'::text, 
  'part-time'::text, 
  'contract'::text, 
  'internship'::text, 
  'remote'::text
]));

-- Add check constraints for experience_level
ALTER TABLE jobs 
ADD CONSTRAINT jobs_experience_level_check 
CHECK (experience_level IS NULL OR experience_level = ANY (ARRAY[
  'entry'::text, 
  'mid'::text, 
  'senior'::text, 
  'lead'::text, 
  'executive'::text
]));

-- Add index for better performance on job searches
CREATE INDEX IF NOT EXISTS jobs_location_idx ON jobs(location);
CREATE INDEX IF NOT EXISTS jobs_employment_type_idx ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS jobs_experience_level_idx ON jobs(experience_level);
CREATE INDEX IF NOT EXISTS jobs_status_created_idx ON jobs(status, created_at DESC);

-- Comment on the table
COMMENT ON TABLE jobs IS 'Enhanced jobs table with comprehensive posting fields for recruiters';
COMMENT ON COLUMN jobs.location IS 'Job location (city, state, remote, etc.)';
COMMENT ON COLUMN jobs.employment_type IS 'Type of employment (full-time, part-time, contract, etc.)';
COMMENT ON COLUMN jobs.experience_level IS 'Required experience level (entry, mid, senior, etc.)';
COMMENT ON COLUMN jobs.salary_range IS 'Salary range as free text (e.g., $80,000 - $120,000)';
COMMENT ON COLUMN jobs.requirements IS 'Job requirements and qualifications';
COMMENT ON COLUMN jobs.benefits IS 'Benefits and perks offered';
COMMENT ON COLUMN jobs.application_deadline IS 'Optional deadline for applications';
