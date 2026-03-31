-- ══════════════════════════════════════════════════════════════════════════════
-- SAFEHIRE ID VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify SafeHire ID generation is working
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. CHECK IF TRIGGER EXISTS
-- ══════════════════════════════════════════════════════════════════════════════
-- Expected: Should return 1 row showing the trigger details
SELECT 
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

-- Alternative check using pg_trigger
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';


-- ══════════════════════════════════════════════════════════════════════════════
-- 2. CHECK IF FUNCTIONS EXIST
-- ══════════════════════════════════════════════════════════════════════════════
-- Expected: Should return 2 rows (generate_safe_hire_id and handle_new_user)
SELECT 
  proname as function_name,
  pronargs as num_arguments,
  prorettype::regtype as return_type,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname IN ('generate_safe_hire_id', 'handle_new_user')
  AND pronamespace = 'public'::regnamespace;


-- ══════════════════════════════════════════════════════════════════════════════
-- 3. TEST SAFEHIRE ID GENERATION DIRECTLY
-- ══════════════════════════════════════════════════════════════════════════════
-- Expected: Should return IDs in format: JS######, EX######, OR######, etc.
SELECT 'Job Seeker' as role, public.generate_safe_hire_id('job_seeker') as generated_id
UNION ALL
SELECT 'Employee', public.generate_safe_hire_id('employee')
UNION ALL
SELECT 'Employer Admin', public.generate_safe_hire_id('employer_admin')
UNION ALL
SELECT 'Organisation', public.generate_safe_hire_id('organisation')
UNION ALL
SELECT 'Reviewer', public.generate_safe_hire_id('reviewer')
UNION ALL
SELECT 'University Principal', public.generate_safe_hire_id('university_principal');


-- ══════════════════════════════════════════════════════════════════════════════
-- 4. CHECK EXISTING PROFILES WITH SAFEHIRE IDs
-- ══════════════════════════════════════════════════════════════════════════════
-- Expected: All profiles should have a SafeHire ID
SELECT 
  safe_hire_id,
  role,
  email,
  full_name,
  aadhaar_full_name,
  aadhaar_verified,
  created_at
FROM profiles
ORDER BY created_at DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- 5. CHECK FOR PROFILES WITHOUT SAFEHIRE IDs
-- ══════════════════════════════════════════════════════════════════════════════
-- Expected: Should return 0 rows (all profiles should have IDs)
SELECT 
  user_id,
  email,
  role,
  created_at
FROM profiles
WHERE safe_hire_id IS NULL;

-- If this returns any rows, you can fix them with:
-- UPDATE profiles 
-- SET safe_hire_id = public.generate_safe_hire_id(COALESCE(role, 'job_seeker'))
-- WHERE safe_hire_id IS NULL;


-- ══════════════════════════════════════════════════════════════════════════════
-- 6. CHECK SAFEHIRE ID UNIQUENESS
-- ══════════════════════════════════════════════════════════════════════════════
-- Expected: Each SafeHire ID should appear only once
SELECT 
  safe_hire_id,
  COUNT(*) as count
FROM profiles
WHERE safe_hire_id IS NOT NULL
GROUP BY safe_hire_id
HAVING COUNT(*) > 1;

-- Expected result: 0 rows (no duplicates)


-- ══════════════════════════════════════════════════════════════════════════════
-- 7. CHECK SAFEHIRE ID FORMAT
-- ══════════════════════════════════════════════════════════════════════════════
-- Verify all IDs follow the correct format (2 letters + 6 digits)
SELECT 
  safe_hire_id,
  role,
  CASE 
    WHEN safe_hire_id ~ '^[A-Z]{2}[0-9]{6}$' THEN '✅ Valid Format'
    ELSE '❌ Invalid Format'
  END as format_check,
  SUBSTRING(safe_hire_id FROM 1 FOR 2) as prefix,
  SUBSTRING(safe_hire_id FROM 3 FOR 6) as digits
FROM profiles
WHERE safe_hire_id IS NOT NULL
ORDER BY created_at DESC;


-- ══════════════════════════════════════════════════════════════════════════════
-- 8. COUNT SAFEHIRE IDs BY ROLE
-- ══════════════════════════════════════════════════════════════════════════════
-- Shows distribution of IDs across roles
SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(safe_hire_id) as users_with_id,
  SUBSTRING(safe_hire_id FROM 1 FOR 2) as expected_prefix
FROM profiles
GROUP BY role, SUBSTRING(safe_hire_id FROM 1 FOR 2)
ORDER BY role;


-- ══════════════════════════════════════════════════════════════════════════════
-- 9. TEST TRIGGER MANUALLY (ADVANCED)
-- ══════════════════════════════════════════════════════════════════════════════
-- WARNING: This will create a test user. Use with caution!
-- Uncomment to test:

/*
-- Create test user (trigger should fire automatically)
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Create test user in auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'test-' || floor(random() * 10000)::text || '@example.com',
    crypt('testpassword', gen_salt('bf')),
    now(),
    now(),
    now()
  ) RETURNING id INTO test_user_id;
  
  -- Check if profile was created with SafeHire ID
  RAISE NOTICE 'Test user created: %', test_user_id;
  
  -- Query the profile
  PERFORM * FROM profiles WHERE user_id = test_user_id;
  
  IF FOUND THEN
    RAISE NOTICE '✅ Profile created successfully by trigger';
  ELSE
    RAISE NOTICE '❌ Profile NOT created - trigger may not be working';
  END IF;
END $$;

-- View the test profile
SELECT * FROM profiles WHERE email LIKE 'test-%@example.com' ORDER BY created_at DESC LIMIT 1;
*/


-- ══════════════════════════════════════════════════════════════════════════════
-- 10. CHECK TRIGGER EVENT DETAILS
-- ══════════════════════════════════════════════════════════════════════════════
-- Shows complete trigger configuration
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  n.nspname AS schema_name,
  p.proname AS function_name,
  CASE t.tgtype::integer & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END AS level,
  CASE t.tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  ARRAY(
    SELECT CASE
      WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
      WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
      WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END
  ) AS events,
  CASE t.tgenabled
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    WHEN 'R' THEN '⚠️ Replica Only'
    WHEN 'A' THEN '⚠️ Always'
  END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';


-- ══════════════════════════════════════════════════════════════════════════════
-- EXPECTED RESULTS SUMMARY
-- ══════════════════════════════════════════════════════════════════════════════

/*
✅ QUERY 1: Should return 1 row showing trigger on auth.users table
✅ QUERY 2: Should return 2 rows (both functions exist)
✅ QUERY 3: Should generate 6 different SafeHire IDs with correct prefixes
✅ QUERY 4: Should list all users with their SafeHire IDs
✅ QUERY 5: Should return 0 rows (no missing IDs)
✅ QUERY 6: Should return 0 rows (no duplicates)
✅ QUERY 7: All IDs should show "✅ Valid Format"
✅ QUERY 8: Shows distribution by role with correct prefixes
✅ QUERY 9: (Optional) Creates test user and verifies trigger
✅ QUERY 10: Shows trigger is ENABLED and fires AFTER INSERT

If all queries return expected results, SafeHire ID generation is working perfectly! 🎉
*/
