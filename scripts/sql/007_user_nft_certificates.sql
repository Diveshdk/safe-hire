-- Create user_nft_certificates table for job seekers to claim their certificates
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

-- Enable RLS (Row Level Security)
ALTER TABLE user_nft_certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_nft_certificates
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_nft_certificates_user_id ON user_nft_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_certificates_nft_token_id ON user_nft_certificates(nft_token_id);
CREATE INDEX IF NOT EXISTS idx_user_nft_certificates_certificate_id ON user_nft_certificates(certificate_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_nft_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_nft_certificates_updated_at BEFORE UPDATE ON user_nft_certificates
FOR EACH ROW EXECUTE FUNCTION update_user_nft_certificates_updated_at();
