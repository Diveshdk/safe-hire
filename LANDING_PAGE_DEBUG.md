# 🐛 Troubleshooting: Landing Page Not Showing

## Issue
You're seeing the signup page directly instead of the landing page when opening http://localhost:3000

## Possible Causes

### 1. You're Already Logged In (Most Likely)

The homepage code has this logic:
```typescript
if (user) {
  redirect("/dashboard")  // If logged in
}
return <LandingPage />     // If not logged in
```

**If you have an active session**, you might be getting redirected somewhere in the chain.

---

## 🔧 Solutions to Try

### Solution 1: Clear Browser Data (Recommended)

**Chrome/Edge:**
1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab
3. Click **Clear site data** button
4. Refresh page

**Or use Incognito/Private window:**
- Chrome: Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows)
- Open: http://localhost:3000

---

### Solution 2: Check if You're Already Logged In

**Open browser console (F12) and run:**
```javascript
// Check localStorage
console.log('Supabase Auth:', localStorage.getItem('sb-fwiitelhheszdoddqtyv-auth-token'))

// Check cookies
console.log('All cookies:', document.cookie)
```

**If you see auth tokens, you're logged in!**

**To logout:**
```javascript
// Clear all auth
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

### Solution 3: Force Landing Page

**Temporarily test if landing page works by commenting out the redirect:**

I can update `app/page.tsx` to always show landing page for testing:

```typescript
export default async function HomePage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  // TEMPORARILY DISABLED FOR TESTING
  // if (user) {
  //   redirect("/dashboard")
  // }

  return (
    <main className="min-h-dvh bg-background">
      {/* Landing page content */}
    </main>
  )
}
```

Want me to do this?

---

### Solution 4: Check Middleware

Let me verify middleware isn't redirecting `/` to signup:

**Current middleware protects only:**
- `/dashboard/*`

**It should NOT touch `/` (homepage)**

---

### Solution 5: Check Dev Server

**Restart dev server:**
```bash
# Stop current server (Ctrl+C)
# Clear Next.js cache
rm -rf .next

# Restart
pnpm dev
```

---

### Solution 6: Check Browser URL

**Make sure you're going to exactly:**
```
http://localhost:3000
```

**NOT:**
```
http://localhost:3000/sign-up  ❌
http://localhost:3000/dashboard ❌
```

---

## 🧪 Quick Test Script

Run this to test what's happening:

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Test the endpoint
curl -I http://localhost:3000

# Look for "Location:" header - if it exists, there's a redirect
```

---

## 🔍 Diagnostic Questions

To help me debug further:

1. **What URL do you see in your browser address bar?**
   - Is it `http://localhost:3000` ?
   - Or does it redirect to `http://localhost:3000/sign-up` ?

2. **Have you signed up before on this browser?**
   - If yes, you might have an active session

3. **What happens if you open in incognito/private window?**

4. **Can you see the browser console (F12) errors?**
   - Any red error messages?

---

## 🎯 Most Likely Issue

**You probably have an old session stored in your browser!**

**Quick fix:**
1. Open incognito/private window
2. Go to http://localhost:3000
3. You should see the landing page!

If it works in incognito but not in regular browser, it confirms you have a session stored.

---

## 🚀 Want Me To Fix It?

I can help you:

1. **Clear the auth session** via script
2. **Temporarily disable the redirect** for testing
3. **Add debug logging** to see what's happening

Which would you prefer?

