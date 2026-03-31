-- ══════════════════════════════════════════════════════════════════════════════
-- Add rejection_reasons and ai_rejection_report columns to applications table
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Store the 3 rejection reasons provided by the employer as a JSON array
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_reasons jsonb;

-- Cache the AI-generated rejection analysis report
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_rejection_report text;
