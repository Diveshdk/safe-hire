-- ══════════════════════════════════════════════════════════════════════════════
-- SAFEHIRE ID: One Per User vs Multiple Function Calls
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- SCENARIO 1: Testing the FUNCTION directly (generates NEW ID each time)
-- ══════════════════════════════════════════════════════════════════════════════

-- Run this multiple times - you'll get DIFFERENT IDs each time
SELECT 'Call 1' as attempt, public.generate_safe_hire_id('job_seeker') as generated_id
UNION ALL
SELECT 'Call 2', public.generate_safe_hire_id('job_seeker')
UNION ALL
SELECT 'Call 3', public.generate_safe_hire_id('job_seeker')
UNION ALL
SELECT 'Call 4', public.generate_safe_hire_id('job_seeker')
UNION ALL
SELECT 'Call 5', public.generate_safe_hire_id('job_seeker');

-- Expected Output:
-- attempt | generated_id
-- --------+--------------
-- Call 1  | JS482719
-- Call 2  | JS293847
-- Call 3  | JS183726
-- Call 4  | JS928374
-- Call 5  | JS574829

-- ✅ This is NORMAL! The function generates a new random ID every time.
-- This is just TESTING - these IDs are NOT saved to any user.


-- ══════════════════════════════════════════════════════════════════════════════
-- SCENARIO 2: Checking ACTUAL user profiles (ONE ID per user)
-- ══════════════════════════════════════════════════════════════════════════════

-- View all users and their SafeHire IDs
SELECT 
  safe_hire_id,
  role,
  email,
  full_name,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Expected Output:
-- safe_hire_id | role       | email              | created_at
-- -------------+------------+--------------------+------------
-- JS482719     | job_seeker | john@example.com   | 2026-03-03
-- EX293847     | employee   | jane@example.com   | 2026-03-03
-- OR183726     | organisation| org@example.com   | 2026-03-02

-- ✅ Each USER has exactly ONE SafeHire ID that never changes


-- ══════════════════════════════════════════════════════════════════════════════
-- SCENARIO 3: What happens when a user signs up?
-- ══════════════════════════════════════════════════════════════════════════════

-- Let's trace what happens:

-- STEP 1: User fills signup form and submits
-- STEP 2: Supabase creates row in auth.users
-- STEP 3: Trigger fires automatically
-- STEP 4: handle_new_user() function runs:

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_safe_hire_id text;
BEGIN
  -- This line calls generate_safe_hire_id ONCE
  v_safe_hire_id := public.generate_safe_hire_id('job_seeker');
  
  -- This line SAVES it to the profile (ONCE)
  INSERT INTO public.profiles (user_id, safe_hire_id, email)
  VALUES (NEW.id, v_safe_hire_id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
*/

-- The function is called ONCE per user signup
-- The ID is saved ONCE to the profiles table
-- The user gets this ID FOREVER


-- ══════════════════════════════════════════════════════════════════════════════
-- PROOF: Check if any user has multiple SafeHire IDs (should be 0 rows)
-- ══════════════════════════════════════════════════════════════════════════════

-- This checks if the same user_id appears multiple times
SELECT 
  user_id,
  COUNT(*) as profile_count,
  array_agg(safe_hire_id) as all_safehire_ids
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no user has multiple profiles)

-- This checks if any SafeHire ID is used by multiple users
SELECT 
  safe_hire_id,
  COUNT(*) as user_count,
  array_agg(email) as all_emails
FROM profiles
GROUP BY safe_hire_id
HAVING COUNT(*) > 1;

-- Expected: 0 rows (each SafeHire ID is unique)


-- ══════════════════════════════════════════════════════════════════════════════
-- UNDERSTANDING THE DIFFERENCE
-- ══════════════════════════════════════════════════════════════════════════════

/*
┌─────────────────────────────────────────────────────────────────┐
│ FUNCTION CALL (Testing)                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SELECT generate_safe_hire_id('job_seeker');                    │
│      ↓                                                           │
│  Generates: JS482719                                             │
│  Saves: ❌ NO - just returns the value                          │
│                                                                  │
│  Run it again:                                                   │
│  SELECT generate_safe_hire_id('job_seeker');                    │
│      ↓                                                           │
│  Generates: JS293847 (DIFFERENT!)                                │
│  Saves: ❌ NO                                                    │
│                                                                  │
│  ✅ This is EXPECTED - the function just generates IDs           │
│  ✅ It doesn't know about users - it's just a generator          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ USER SIGNUP (Production)                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User: john@example.com signs up                                 │
│      ↓                                                           │
│  Trigger calls: generate_safe_hire_id('job_seeker')             │
│      ↓                                                           │
│  Generates: JS482719                                             │
│      ↓                                                           │
│  Saves to profiles table:                                        │
│    user_id: uuid-123                                             │
│    safe_hire_id: JS482719 ✅                                     │
│    email: john@example.com                                       │
│      ↓                                                           │
│  John logs in again tomorrow:                                    │
│    - Still has: JS482719 ✅                                      │
│    - Same ID forever!                                            │
│                                                                  │
│  User: jane@example.com signs up (different user)                │
│      ↓                                                           │
│  Trigger calls: generate_safe_hire_id('job_seeker')             │
│      ↓                                                           │
│  Generates: JS293847 (DIFFERENT from John!)                      │
│      ↓                                                           │
│  Saves to profiles table:                                        │
│    user_id: uuid-456                                             │
│    safe_hire_id: JS293847 ✅                                     │
│    email: jane@example.com                                       │
│                                                                  │
│  ✅ Each user gets ONE unique SafeHire ID                        │
│  ✅ The ID never changes                                         │
│  ✅ No two users have the same ID                                │
└─────────────────────────────────────────────────────────────────┘
*/


-- ══════════════════════════════════════════════════════════════════════════════
-- WHY THIS DESIGN?
-- ══════════════════════════════════════════════════════════════════════════════

/*
The function is designed to be:

1. STATELESS
   - It doesn't store anything
   - It just generates and returns an ID
   - This makes it reusable and testable

2. REUSABLE
   - Can be called by the trigger
   - Can be called manually if needed
   - Can generate test data

3. SAFE
   - Checks for uniqueness BEFORE returning
   - Guarantees no duplicates
   - Loops until it finds a unique ID

The TRIGGER is what makes it work for users:
   - Calls the function ONCE per signup
   - SAVES the result to profiles table
   - Ensures each user gets exactly ONE ID
*/


-- ══════════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ══════════════════════════════════════════════════════════════════════════════

/*
QUESTION: "Is it supposed to only generate one SafeHire ID?"

ANSWER:
✅ YES - Each USER gets only ONE SafeHire ID (stored in profiles table)
✅ BUT - The FUNCTION can generate unlimited IDs (for testing/flexibility)

When you run:
  SELECT generate_safe_hire_id('job_seeker');
  
You're just TESTING the generator - it creates a new random ID each time.
This is EXPECTED and CORRECT behavior.

When a USER signs up:
  1. Trigger calls the function ONCE
  2. Stores the result in profiles table ONCE
  3. User has this ONE ID forever
  
THINK OF IT LIKE:
- The function is a "random number generator"
- The trigger is the "account creation process"
- The profile is the "permanent record"

Every time you press "generate random number", you get a new number.
But when you create an account, you get ONE number that's saved forever.
*/

-- ══════════════════════════════════════════════════════════════════════════════
-- TEST IT YOURSELF
-- ══════════════════════════════════════════════════════════════════════════════

-- Test 1: Generate 5 IDs - should all be different
SELECT generate_safe_hire_id('job_seeker') as id1,
       generate_safe_hire_id('job_seeker') as id2,
       generate_safe_hire_id('job_seeker') as id3,
       generate_safe_hire_id('job_seeker') as id4,
       generate_safe_hire_id('job_seeker') as id5;

-- Test 2: Check your actual users - each should have exactly ONE ID
SELECT 
  email,
  safe_hire_id,
  'This user has 1 SafeHire ID that never changes' as note
FROM profiles;

-- Test 3: Verify no duplicates exist
SELECT 
  CASE 
    WHEN COUNT(DISTINCT safe_hire_id) = COUNT(*) 
    THEN '✅ All SafeHire IDs are unique'
    ELSE '❌ Duplicate SafeHire IDs found!'
  END as uniqueness_check
FROM profiles;
