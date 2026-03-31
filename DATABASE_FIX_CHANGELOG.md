# Database Script Fix - Changelog

## Issue Reported
**Error:** `ERROR: 42P01: relation "public.applications" does not exist`

**Root Cause:** RLS policies were being created before the tables they referenced existed. For example, the `profiles` table had a policy that referenced the `applications` table, but `applications` hadn't been created yet.

---

## Fix Applied

### Changes Made to `000_FRESH_INSTALL.sql`

**Before:**
```
Table created → Indexes → Enable RLS → Create policies immediately
```

**After:**
```
1. All tables created (Steps 2-13)
2. Helper functions (Step 14)
3. Triggers (Steps 15-16)
4. ALL RLS policies (Step 17) ← NEW STEP!
```

---

## Detailed Changes

### Tables Affected (All 11 tables)
1. ✅ **profiles** - Removed 4 policies, moved to Step 17
2. ✅ **companies** - Removed 2 policies, moved to Step 17
3. ✅ **jobs** - Removed 2 policies, moved to Step 17
4. ✅ **applications** - Removed 4 policies, moved to Step 17
5. ✅ **documents** - Removed 3 policies, moved to Step 17
6. ✅ **events** - Removed 2 policies, moved to Step 17
7. ✅ **certificates** - Removed 4 policies, moved to Step 17
8. ✅ **university_results** - Removed 5 policies, moved to Step 17
9. ✅ **university_principals** - Removed 3 policies, moved to Step 17
10. ✅ **achievement_badges** - Removed 3 policies, moved to Step 17

**Total Policies Moved:** 33

---

## What Stayed the Same

✅ Table definitions (no changes)
✅ Indexes (no changes)
✅ `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (stays with each table)
✅ Functions and triggers (no changes)
✅ Policy logic (no changes, just moved)

---

## New Step 17: Row Level Security Policies

All 33 RLS policies are now created in a single section at the end of the script, organized by table:

```sql
-- STEP 17: ROW LEVEL SECURITY POLICIES
-- All policies defined here after all tables are created

-- PROFILES POLICIES (4)
CREATE POLICY "profiles_select_own" ...
CREATE POLICY "profiles_insert_own" ...
CREATE POLICY "profiles_update_own" ...
CREATE POLICY "profiles_employer_read_applicants" ...

-- COMPANIES POLICIES (2)
-- ... and so on for all 11 tables
```

---

## Benefits

1. **✅ No Dependency Errors** - All referenced tables exist before policies are created
2. **✅ Better Organization** - All security policies in one place
3. **✅ Easier to Review** - Security rules are grouped together
4. **✅ Maintains Functionality** - Same exact policies, just better ordered

---

## Testing Checklist

After running the fixed script:

- [ ] All 11 tables created successfully
- [ ] All 33 RLS policies active
- [ ] SafeHire ID auto-generation working
- [ ] No SQL errors in console
- [ ] Can create test users
- [ ] Policies working as expected

---

## Migration Path

If you already ran the old script and got errors:

1. **Run:** `scripts/sql/000_CLEANUP.sql` (cleans everything)
2. **Run:** `scripts/sql/000_FRESH_INSTALL.sql` (new fixed version)
3. **Verify:** Check for "Installation Complete!" message

---

**Fixed on:** March 3, 2026
**Script Version:** 2.0 (Fixed)
**Total Lines Changed:** ~300 (policies moved)
**Breaking Changes:** None
