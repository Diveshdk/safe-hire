-- MIGRATION: 001_ADD_AADHAAR_NUMBER.sql
-- Adds aadhaar_number to profiles table with unique constraint

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aadhaar_number text;

-- Add unique constraint to ensure no duplicate Aadhaar numbers
ALTER TABLE public.profiles
ADD CONSTRAINT unique_aadhaar_number UNIQUE (aadhaar_number);

-- Comment to document
COMMENT ON COLUMN public.profiles.aadhaar_number IS 'Stored Aadhaar number (extracted via OCR) for uniqueness check.';
