# INSTITUTION DEMO ACCOUNT SETUP

## Problem: Email Confirmation Required
Supabase requires email confirmation by default, which makes demo setup difficult.

## Solution: Manual Demo Account Creation

### Step 1: Create Institution Account in Supabase Dashboard

1. **Go to your Supabase Dashboard**
2. **Navigate to:** Authentication > Users
3. **Click:** "Add user"  
4. **Fill in:**
   - Email: `demo-university@safehire.com`
   - Password: `DemoUniversity123!`
   - ✅ **Check "Email confirmed"** (This bypasses email confirmation!)
5. **Click:** "Create user"
6. **Copy the User ID** from the created user

### Step 2: Run SQL Setup

Replace `YOUR_USER_ID_HERE` in the SQL file with the actual user ID:

```sql
-- In Supabase SQL Editor, run:
UPDATE profiles SET 
  role = 'institution',
  institution_name = 'MIT Demo University',
  institution_type = 'University',
  aadhaar_verified = true
WHERE user_id = 'YOUR_ACTUAL_USER_ID_HERE';
```

### Step 3: Create Demo Events & Certificates

```sql
-- Insert demo hackathon event
INSERT INTO institution_events (
  institution_id,
  event_name,
  event_type,
  description,
  event_date,
  status
) VALUES (
  'YOUR_ACTUAL_USER_ID_HERE',
  'MIT AI Hackathon 2024',
  'hackathon',
  '48-hour AI hackathon with cash prizes',
  '2024-03-15',
  'completed'
);

-- Create demo certificates
INSERT INTO nft_certificates (
  institution_id,
  certificate_name,
  certificate_type,
  recipient_name,
  nft_code,
  description,
  issue_date,
  is_active,
  is_claimed
) VALUES 
('YOUR_ACTUAL_USER_ID_HERE', 'Hackathon Winner', 'competition', 'John Doe', 'HACK2024001', 'First place winner', '2024-03-17', true, false),
('YOUR_ACTUAL_USER_ID_HERE', 'Bachelor Degree', 'academic', 'Jane Smith', 'MIT2024CS002', 'CS Bachelor degree', '2024-05-15', true, false),
('YOUR_ACTUAL_USER_ID_HERE', 'Master Degree', 'academic', 'Alice Johnson', 'MIT2024MS003', 'Data Science Masters', '2024-05-15', true, false);
```

## Alternative: Quick Test Method

**If you just want to test the NFT verification system:**

1. Create any **Job Seeker** account (use your real email)
2. Use these **pre-made NFT codes** in academic verification:

```
John Doe → HACK2024001
Jane Smith → MIT2024CS002  
Alice Johnson → MIT2024MS003
```

## Login Credentials (After Manual Setup):
- **Email:** demo-university@safehire.com
- **Password:** DemoUniversity123!
- **Role:** Institution
- **Access:** Full institution dashboard with events, certificates, bulk generation

This bypasses the email confirmation issue and gives you a fully functional demo institution account!
