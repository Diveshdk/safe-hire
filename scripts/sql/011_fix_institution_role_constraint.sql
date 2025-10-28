-- Fix for institution role constraint
-- This script updates the profiles table constraint to allow 'institution' role

-- Drop the old constraint that didn't include institution
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint that includes all four roles: job_seeker, employer_admin, reviewer, and institution
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['job_seeker'::text, 'employer_admin'::text, 'reviewer'::text, 'institution'::text]));

-- Verify the constraint is updated
-- Run this to check: SELECT conname, pg_get_constraintdef(c.oid) as constraint_def FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'profiles' AND contype = 'c';
