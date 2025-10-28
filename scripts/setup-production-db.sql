-- Complete database setup for Safe Hire System
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if the user_nft_certificates table exists
CREATE TABLE IF NOT EXISTS user_nft_certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nft_token_id text NOT NULL,
  certificate_id text NOT NULL,
  institution_name text NOT NULL,
  program_name text NOT NULL,
  program_type text NOT NULL,
  issue_date date NOT NULL,
  grade text,
  skills text[],
  verification_status text DEFAULT 'verified',
  blockchain_hash text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, nft_token_id)
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE user_nft_certificates ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own NFT certificates" ON user_nft_certificates;
DROP POLICY IF EXISTS "Users can insert their own NFT certificates" ON user_nft_certificates;
DROP POLICY IF EXISTS "Users can update their own NFT certificates" ON user_nft_certificates;
DROP POLICY IF EXISTS "Users can delete their own NFT certificates" ON user_nft_certificates;
DROP POLICY IF EXISTS "Recruiters can view job seeker NFT certificates for lookup" ON user_nft_certificates;

-- 4. Create RLS policies for user_nft_certificates
-- Users can view their own NFT certificates
CREATE POLICY "Users can view their own NFT certificates" ON user_nft_certificates
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own NFT certificates
CREATE POLICY "Users can insert their own NFT certificates" ON user_nft_certificates
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own NFT certificates
CREATE POLICY "Users can update their own NFT certificates" ON user_nft_certificates
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own NFT certificates
CREATE POLICY "Users can delete their own NFT certificates" ON user_nft_certificates
FOR DELETE USING (auth.uid() = user_id);

-- Recruiters can view NFT certificates of job seekers for profile lookup
CREATE POLICY "Recruiters can view job seeker NFT certificates for lookup" ON user_nft_certificates
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'recruiter'
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = user_nft_certificates.user_id 
    AND profiles.role = 'job_seeker'
  )
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_nft_certificates_user_id ON user_nft_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_certificates_nft_token_id ON user_nft_certificates(nft_token_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_certificates_certificate_id ON user_nft_certificates(certificate_id);

-- 6. Update timestamp trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_user_nft_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger
DROP TRIGGER IF EXISTS update_user_nft_certificates_updated_at ON user_nft_certificates;
CREATE TRIGGER update_user_nft_certificates_updated_at 
BEFORE UPDATE ON user_nft_certificates
FOR EACH ROW EXECUTE FUNCTION update_user_nft_certificates_updated_at();

-- 8. Also ensure issued_certificates table exists (for NFT lookup)
CREATE TABLE IF NOT EXISTS issued_certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  student_email text,
  institution_name text NOT NULL,
  program_name text NOT NULL,
  program_type text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date,
  grade text,
  skills text[],
  additional_info text,
  nft_token_id text UNIQUE,
  blockchain_hash text,
  ipfs_url text,
  status text DEFAULT 'issued',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Enable RLS on issued_certificates
ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;

-- 10. Create policies for issued_certificates
DROP POLICY IF EXISTS "Institutions can manage their own certificates" ON issued_certificates;
DROP POLICY IF EXISTS "Anyone can view issued certificates for verification" ON issued_certificates;

CREATE POLICY "Institutions can manage their own certificates" ON issued_certificates
FOR ALL USING (
  auth.uid() = institution_id
);

CREATE POLICY "Anyone can view issued certificates for verification" ON issued_certificates
FOR SELECT USING (true);

-- 11. Create indexes for issued_certificates
CREATE INDEX IF NOT EXISTS idx_issued_certificates_institution_id ON issued_certificates(institution_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_nft_token_id ON issued_certificates(nft_token_id);
CREATE INDEX IF NOT EXISTS idx_issued_certificates_status ON issued_certificates(status);

-- 12. Verification: Check that tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_nft_certificates') THEN
        RAISE NOTICE 'SUCCESS: user_nft_certificates table exists';
    ELSE
        RAISE EXCEPTION 'ERROR: user_nft_certificates table does not exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issued_certificates') THEN
        RAISE NOTICE 'SUCCESS: issued_certificates table exists';
    ELSE
        RAISE EXCEPTION 'ERROR: issued_certificates table does not exist';
    END IF;
END $$;

-- 13. Insert some demo data for testing
INSERT INTO issued_certificates (
  institution_id,
  student_name,
  student_email,
  institution_name,
  program_name,
  program_type,
  issue_date,
  grade,
  skills,
  nft_token_id,
  blockchain_hash
) VALUES (
  -- You'll need to replace this with an actual institution user_id
  (SELECT user_id FROM profiles WHERE role = 'institution' LIMIT 1),
  'John Doe',
  'john.doe@example.com',
  'Tech University',
  'Full Stack Web Development',
  'Bootcamp',
  '2024-01-15',
  'A+',
  ARRAY['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
  'NFT-12345',
  '0x1234567890abcdef'
) ON CONFLICT (nft_token_id) DO NOTHING;

RAISE NOTICE 'Database setup completed successfully!';
