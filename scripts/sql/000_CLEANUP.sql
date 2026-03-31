-- ══════════════════════════════════════════════════════════════════════════════
-- SAFEHIRE PLATFORM - DATABASE CLEANUP SCRIPT
-- ⚠️ WARNING: This will delete ALL data in your SafeHire database
-- Run this BEFORE running 000_FRESH_INSTALL.sql
-- ══════════════════════════════════════════════════════════════════════════════

-- Step 1: Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS increment_certificate_count ON public.certificates;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
DROP TRIGGER IF EXISTS update_university_results_updated_at ON public.university_results;
DROP TRIGGER IF EXISTS update_university_principals_updated_at ON public.university_principals;

-- Step 2: Drop all tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS public.achievement_badges CASCADE;
DROP TABLE IF EXISTS public.university_results CASCADE;
DROP TABLE IF EXISTS public.university_principals CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 3: Drop legacy tables (if they exist)
DROP TABLE IF EXISTS public.anchors CASCADE;
DROP TABLE IF EXISTS public.credentials CASCADE;
DROP TABLE IF EXISTS public.verifications CASCADE;
DROP TABLE IF EXISTS public.explainability CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Step 4: Drop all functions
DROP FUNCTION IF EXISTS public.generate_safe_hire_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.generate_verification_hash(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.can_principal_approve_result(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_event_certificate_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 5: Verify cleanup
SELECT 
  'Cleanup Complete!' as status,
  COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- If remaining_tables = 0, you're ready to run 000_FRESH_INSTALL.sql
