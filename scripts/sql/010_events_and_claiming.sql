-- Create events and certificate claiming system
-- This supports institutions creating events (hackathons, competitions) and bulk certificate generation

-- Events table for hackathons, competitions, etc.
CREATE TABLE IF NOT EXISTS institution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'hackathon', 'competition', 'exam', 'graduation', 'workshop'
  description TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add claimed status and claimer to certificates
ALTER TABLE nft_certificates 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES institution_events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE;

-- Certificate claims tracking
CREATE TABLE IF NOT EXISTS certificate_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES nft_certificates(id) ON DELETE CASCADE,
  claimer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_status TEXT DEFAULT 'verified', -- 'verified', 'pending', 'rejected'
  UNIQUE(certificate_id) -- Each certificate can only be claimed once
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_institution_events_institution_id ON institution_events(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_events_status ON institution_events(status);
CREATE INDEX IF NOT EXISTS idx_nft_certificates_event_id ON nft_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_nft_certificates_claimed_by ON nft_certificates(claimed_by);
CREATE INDEX IF NOT EXISTS idx_certificate_claims_claimer_id ON certificate_claims(claimer_id);

-- RLS Policies for events
ALTER TABLE institution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institutions can manage their own events" ON institution_events
  FOR ALL USING (auth.uid() = institution_id);

CREATE POLICY "Anyone can view active events" ON institution_events
  FOR SELECT USING (status IN ('upcoming', 'ongoing'));

-- RLS Policies for certificate claims
ALTER TABLE certificate_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims" ON certificate_claims
  FOR SELECT USING (auth.uid() = claimer_id);

CREATE POLICY "Users can create claims for themselves" ON certificate_claims
  FOR INSERT WITH CHECK (auth.uid() = claimer_id);

CREATE POLICY "Institutions can view claims for their certificates" ON certificate_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nft_certificates nc 
      WHERE nc.id = certificate_claims.certificate_id 
      AND nc.institution_id = auth.uid()
    )
  );

-- Update certificates RLS to allow claiming
CREATE POLICY IF NOT EXISTS "Anyone can view active certificates for claiming" ON nft_certificates
  FOR SELECT USING (is_active = true AND is_claimed = false);

-- Function to claim a certificate
CREATE OR REPLACE FUNCTION claim_certificate(
  p_nft_code TEXT,
  p_claimer_name TEXT
)
RETURNS JSON AS $$
DECLARE
  cert_record RECORD;
  claim_result JSON;
BEGIN
  -- Find the certificate
  SELECT * INTO cert_record 
  FROM nft_certificates 
  WHERE nft_code = p_nft_code 
  AND is_active = true 
  AND is_claimed = false;
  
  -- Check if certificate exists
  IF cert_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Certificate not found or already claimed'
    );
  END IF;
  
  -- Check if name matches
  IF LOWER(TRIM(cert_record.recipient_name)) != LOWER(TRIM(p_claimer_name)) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Name does not match certificate recipient'
    );
  END IF;
  
  -- Claim the certificate
  UPDATE nft_certificates 
  SET 
    claimed_by = auth.uid(),
    claimed_at = NOW(),
    is_claimed = true
  WHERE id = cert_record.id;
  
  -- Create claim record
  INSERT INTO certificate_claims (certificate_id, claimer_id)
  VALUES (cert_record.id, auth.uid());
  
  RETURN json_build_object(
    'success', true,
    'message', 'Certificate claimed successfully',
    'certificate', json_build_object(
      'name', cert_record.certificate_name,
      'type', cert_record.certificate_type,
      'nft_code', cert_record.nft_code,
      'issue_date', cert_record.issue_date
    )
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error claiming certificate: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for bulk certificate generation
CREATE OR REPLACE FUNCTION bulk_create_certificates(
  p_event_id UUID,
  p_certificates JSONB
)
RETURNS JSON AS $$
DECLARE
  cert_data JSONB;
  created_count INTEGER := 0;
  total_count INTEGER;
  nft_code TEXT;
BEGIN
  total_count := jsonb_array_length(p_certificates);
  
  FOR cert_data IN SELECT * FROM jsonb_array_elements(p_certificates)
  LOOP
    -- Generate unique NFT code
    SELECT generate_nft_code() INTO nft_code;
    
    -- Insert certificate
    INSERT INTO nft_certificates (
      institution_id,
      event_id,
      certificate_name,
      certificate_type,
      recipient_name,
      nft_code,
      description,
      issue_date,
      metadata,
      is_active
    ) VALUES (
      auth.uid(),
      p_event_id,
      cert_data->>'certificate_name',
      cert_data->>'certificate_type',
      cert_data->>'recipient_name',
      nft_code,
      cert_data->>'description',
      COALESCE((cert_data->>'issue_date')::DATE, CURRENT_DATE),
      COALESCE(cert_data->'metadata', '{}'::JSONB),
      true
    );
    
    created_count := created_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'message', format('Successfully created %s certificates', created_count),
    'created_count', created_count,
    'total_requested', total_count
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error creating certificates: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for events
CREATE OR REPLACE FUNCTION update_updated_at_events()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institution_events_updated_at 
BEFORE UPDATE ON institution_events 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_events();
