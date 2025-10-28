-- Create NFT certificates table for institutions to issue verifiable credentials
CREATE TABLE IF NOT EXISTS nft_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_name TEXT NOT NULL,
  certificate_type TEXT NOT NULL, -- 'academic', 'competition', 'certification', 'course'
  recipient_name TEXT NOT NULL,
  nft_code TEXT NOT NULL UNIQUE,
  description TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nft_certificates_institution_id ON nft_certificates(institution_id);
CREATE INDEX IF NOT EXISTS idx_nft_certificates_nft_code ON nft_certificates(nft_code);
CREATE INDEX IF NOT EXISTS idx_nft_certificates_recipient_name ON nft_certificates(recipient_name);

-- Enable RLS
ALTER TABLE nft_certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Institutions can view their own certificates" ON nft_certificates
  FOR SELECT USING (auth.uid() = institution_id);

CREATE POLICY "Institutions can insert their own certificates" ON nft_certificates
  FOR INSERT WITH CHECK (auth.uid() = institution_id);

CREATE POLICY "Institutions can update their own certificates" ON nft_certificates
  FOR UPDATE USING (auth.uid() = institution_id);

CREATE POLICY "Anyone can read active certificates for verification" ON nft_certificates
  FOR SELECT USING (is_active = true);

-- Create function to generate unique NFT code
CREATE OR REPLACE FUNCTION generate_nft_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a 12-character alphanumeric code
    code := UPPER(substring(encode(gen_random_bytes(9), 'base64') from 1 for 12));
    -- Remove any non-alphanumeric characters
    code := regexp_replace(code, '[^A-Z0-9]', '', 'g');
    -- Ensure it's exactly 12 characters
    IF length(code) >= 12 THEN
      code := substring(code from 1 for 12);
      -- Check if this code already exists
      SELECT EXISTS(SELECT 1 FROM nft_certificates WHERE nft_code = code) INTO exists_check;
      IF NOT exists_check THEN
        RETURN code;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nft_certificates_updated_at 
BEFORE UPDATE ON nft_certificates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
