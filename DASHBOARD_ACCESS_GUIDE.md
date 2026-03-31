# 🧭 Dashboard Access Guide

## 🔍 Current Situation

**You're seeing:** Sign-up page when opening `http://localhost:3000`

**Why:** You're not logged in yet, and the homepage shows the landing page with "Get Started" button for new users.

---

## 📍 How to Access the Dashboard

### Method 1: Create New Account (Recommended for Testing)

1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000
   ```

3. **Click "Get Started" or "Create Safe Hire ID"**
   - Takes you to: `http://localhost:3000/sign-up`

4. **Complete signup flow:**
   
   **Step 1: Choose Role**
   - Job Seeker (for testing job applications)
   - Employee (for posting jobs)
   - Organisation (for issuing certificates)

   **Step 2: Enter Details**
   - Full name
   - Email (use any test email like `test@example.com`)
   - Password (min 6 characters)

   **Step 3: Aadhaar Verification**
   - For Job Seeker/Employee: Choose **"Demo Mode"**
   - Enter any name (e.g., "Test User")
   - Click "Verify with Demo Data"

   **Step 4 (Employee only): Company Verification**
   - Check **"Use demo company"**
   - Click "Complete Setup"

5. **You'll be redirected to your dashboard! 🎉**

---

### Method 2: Sign In (If you already have an account)

1. Go to: `http://localhost:3000/sign-in`
2. Enter your email and password
3. Click "Sign In"
4. Redirects to dashboard based on your role

---

### Method 3: Direct Dashboard URL

If you're already logged in:
```
http://localhost:3000/dashboard
```

If not logged in → Redirects to sign-in page automatically

---

## 🎯 Dashboard URLs by Role

After login, you'll see one of these dashboards:

### 1. Job Seeker Dashboard
**URL:** `http://localhost:3000/dashboard/job-seeker`

**Features:**
- ✅ SafeHire ID display
- ✅ Aadhaar verification status
- ✅ Browse open jobs
- ✅ Apply for jobs
- ✅ View my applications
- ✅ Upload documents (resume, certificates)
- ✅ View received certificates
- ✅ View university results
- ✅ AI resume reviewer

---

### 2. Employee/Employer Dashboard
**URL:** `http://localhost:3000/dashboard/employee`

**Features:**
- ✅ SafeHire ID display
- ✅ Company verification
- ✅ Post jobs
- ✅ Manage jobs
- ✅ View applicants
- ✅ Update application status
- ✅ AI resume reviewer

---

### 3. Organisation Dashboard
**URL:** `http://localhost:3000/dashboard/organisation`

**Features:**
- ✅ SafeHire ID display
- ✅ Create events
- ✅ Manage events
- ✅ Issue certificates (batch)
- ✅ Upload university results

**Subpages:**
- Events: `/dashboard/organisation/events`
- University Results: `/dashboard/organisation/university-results`

---

## 🔄 Complete User Journey

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Open App                                            │
│  URL: http://localhost:3000                                  │
│                                                              │
│  You see:                                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Safe Hire                    Sign In  Get Started │     │
│  │                                                     │     │
│  │  Making Hiring Safe and Easy                       │     │
│  │                                                     │     │
│  │  [Create Safe Hire ID]  [Learn More]              │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
         ┌─────────────────┴─────────────────┐
         │                                   │
    Click "Sign In"              Click "Get Started"
         │                                   │
         ↓                                   ↓
┌─────────────────────┐         ┌─────────────────────┐
│   Sign In Page      │         │   Sign Up Page      │
│  /sign-in           │         │  /sign-up           │
│                     │         │                     │
│  Email:    _______  │         │  1. Choose Role     │
│  Password: _______  │         │  2. Enter Details   │
│                     │         │  3. Aadhaar Verify  │
│  [Sign In]          │         │  4. Company (if emp)│
└─────────────────────┘         └─────────────────────┘
         │                                   │
         └─────────────────┬─────────────────┘
                           ↓
              Authentication Complete
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Automatic Redirect to Dashboard (based on role)            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Job Seeker → /dashboard/job-seeker                         │
│  Employee → /dashboard/employee                              │
│  Organisation → /dashboard/organisation                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Quick Test (5 minutes)

### Test as Job Seeker:

1. **Start server:**
   ```bash
   cd "/Users/divesh/Downloads/safe-hire-system-design 3"
   pnpm dev
   ```

2. **Open:** http://localhost:3000

3. **Click:** "Get Started"

4. **Select:** "Job Seeker" role

5. **Fill form:**
   ```
   Full Name: Test User
   Email: testuser@example.com
   Password: test123
   ```

6. **Aadhaar:** Choose "Demo Mode" → Enter "Test User" → Verify

7. **Result:** Dashboard opens with SafeHire ID (e.g., JS482719) ✅

---

## 🔐 Why You See Sign-up Page

The app routing works like this:

```typescript
// app/page.tsx (Homepage)
if (user) {
  redirect("/dashboard")  // If logged in → Dashboard
} else {
  return <LandingPage />   // If not logged in → Landing page
}
```

**Since you're not logged in yet, you see the landing page with the "Get Started" button.**

This is the **correct behavior**! The landing page is designed to welcome new users and guide them to sign up.

---

## 🚀 Next Steps

1. ✅ **Start dev server:** `pnpm dev`
2. ✅ **Open:** http://localhost:3000
3. ✅ **Click "Get Started"** → Complete signup
4. ✅ **Dashboard opens automatically!**

Then you can test all the features:
- Job Seeker: Browse jobs, apply, upload documents
- Employee: Post jobs, view applicants
- Organisation: Create events, issue certificates

---

## 🆘 Troubleshooting

### Issue: "Can't access dashboard even after signup"

**Check:**
```sql
-- In Supabase SQL Editor, check if user was created
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- Check if profile was created with SafeHire ID
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
```

**Expected:** Both should show your newly created user

---

### Issue: "Redirects to sign-in immediately"

**Cause:** Session cookie not set

**Solution:**
1. Clear browser cookies/localStorage
2. Try in incognito window
3. Restart dev server

---

### Issue: "Dashboard is blank/white screen"

**Check browser console (F12):**
- Look for API errors
- Check Supabase connection

**Verify environment variables:**
```bash
# Check .env.local exists
cat .env.local

# Should contain:
# NEXT_PUBLIC_SUPABASE_URL=your-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

---

## 📋 Summary

**Q: Where is the dashboard?**

**A:** Dashboard is at `/dashboard`, but you need to **sign up/login first**!

**Flow:**
```
http://localhost:3000 (Landing)
    ↓ Click "Get Started"
/sign-up (Registration)
    ↓ Complete signup
/dashboard/job-seeker (Your Dashboard!) ✅
```

**Current State:** You're seeing the landing/signup page because you haven't signed up yet - **this is expected!**

Just complete the signup flow and you'll see your dashboard with your SafeHire ID! 🎉

