-- ══════════════════════════════════════════════════════════════════════════════
-- SAFEHIRE PLATFORM - COMPLETE DATABASE SCHEMA
-- Fresh Installation Script
-- Run this script in your Supabase SQL Editor to set up everything from scratch
-- ══════════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 1: EXTENSIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 2: PROFILES TABLE (User Management)
-- Links to auth.users, stores role, SafeHire ID, verification status
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- SafeHire ID: Unique identifier (JS123456 for job seekers, EX123456 for employers, etc.)
  safe_hire_id text UNIQUE,
  
  -- Role-based access control
  role text NOT NULL DEFAULT 'job_seeker' CHECK (role IN (
    'job_seeker',           -- Individuals looking for jobs
    'employer_admin',       -- Company admins who post jobs
    'employee',             -- Company employees
    'organisation',         -- Event organizers, universities
    'university_principal', -- University principals for result verification
    'reviewer'              -- Platform reviewers/moderators
  )),
  
  -- User information
  full_name text,
  email text,
  phone text,
  
  -- Aadhaar verification
  aadhaar_full_name text,
  aadhaar_verified boolean NOT NULL DEFAULT false,
  aadhaar_verified_at timestamptz,
  
  -- Profile completeness
  profile_complete boolean DEFAULT false,
  profile_picture_url text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_safe_hire_id_idx ON public.profiles(safe_hire_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 3: SAFEHIRE ID GENERATION FUNCTION
-- Generates unique SafeHire IDs with role-based prefixes
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generate_safe_hire_id(p_role text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_random text;
  v_safe_hire_id text;
  v_exists boolean;
BEGIN
  -- Determine prefix based on role
  v_prefix := CASE 
    WHEN p_role IN ('employer_admin', 'employee') THEN 'EX'
    WHEN p_role = 'organisation' THEN 'OR'
    WHEN p_role = 'reviewer' THEN 'RV'
    WHEN p_role = 'university_principal' THEN 'UP'
    ELSE 'JS' -- job_seeker
  END;
  
  -- Generate unique SafeHire ID
  LOOP
    v_random := lpad(floor(random() * 1000000)::text, 6, '0');
    v_safe_hire_id := v_prefix || v_random;
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE safe_hire_id = v_safe_hire_id) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_safe_hire_id;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 4: PROFILE AUTO-CREATION TRIGGER
-- Automatically creates a profile with SafeHire ID when a user signs up
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_safe_hire_id text;
BEGIN
  -- Generate SafeHire ID (default role is job_seeker)
  v_safe_hire_id := public.generate_safe_hire_id('job_seeker');
  
  -- Insert profile with SafeHire ID and email
  INSERT INTO public.profiles (user_id, safe_hire_id, email)
  VALUES (NEW.id, v_safe_hire_id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 5: COMPANIES TABLE
-- Stores company information, verification status
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company owner (employer_admin)
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company details
  name text NOT NULL,
  registration_number text NOT NULL, -- CIN or PAN
  industry text,
  website text,
  description text,
  logo_url text,
  
  -- Verification
  verification_status text DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'demo', 'failed'
  )),
  verifier_source text, -- 'gridlines', 'manual', etc.
  verified_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS companies_owner_idx ON public.companies(owner_user_id);
CREATE INDEX IF NOT EXISTS companies_verification_idx ON public.companies(verification_status);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 6: JOBS TABLE
-- Job postings created by companies
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company reference
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Job details
  title text NOT NULL,
  description text,
  requirements text,
  location text,
  salary_range text,
  job_type text CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  
  -- Additional metadata
  requirements_json jsonb DEFAULT '{}',
  
  -- Status
  status text DEFAULT 'open' CHECK (status IN ('draft', 'open', 'closed')),
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_company_idx ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 7: APPLICATIONS TABLE
-- Job applications from seekers to jobs
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  seeker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application details
  safe_hire_id text,
  cover_letter text,
  resume_url text,
  
  -- Status
  status text DEFAULT 'applied' CHECK (status IN (
    'applied', 'under_review', 'verified', 'not_authentic', 'hired', 'rejected'
  )),
  decision_reason text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one application per seeker per job
  UNIQUE(job_id, seeker_user_id)
);

CREATE INDEX IF NOT EXISTS applications_job_idx ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS applications_seeker_idx ON public.applications(seeker_user_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON public.applications(status);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 8: DOCUMENTS TABLE
-- Stores all documents uploaded by users or issued by organizations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Document details
  doc_type text NOT NULL CHECK (doc_type IN (
    'aadhaar', 'certificate', 'academic_result', 'resume', 
    'event_certificate', 'other'
  )),
  title text,
  file_url text,
  file_size bigint,
  mime_type text,
  
  -- OCR extracted data
  ocr_name text,
  ocr_data jsonb DEFAULT '{}',
  
  -- Verification
  verification_status text DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'verified', 'flagged', 'unverified'
  )),
  
  -- Issuer information (for certificates)
  issued_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text,
  issued_by_org_name text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_user_idx ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS documents_type_idx ON public.documents(doc_type);
CREATE INDEX IF NOT EXISTS documents_verification_idx ON public.documents(verification_status);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 9: EVENTS TABLE
-- Events organized by organizations for certificate distribution
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organizer
  org_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event details
  title text NOT NULL,
  achievement text,
  description text,
  event_type text, -- Competition, Workshop, Seminar, etc.
  event_date date,
  location text,
  
  -- Certificate counts
  total_certificates_issued integer DEFAULT 0,
  winner_certificates_issued integer DEFAULT 0,
  participant_certificates_issued integer DEFAULT 0,
  
  -- Custom fields for certificate data
  custom_fields jsonb DEFAULT '[]',
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_org_idx ON public.events(org_user_id);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(event_date);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 10: CERTIFICATES TABLE
-- Digital certificates issued via events
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Certificate details
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_safe_hire_id text NOT NULL,
  
  -- Certificate type and metadata
  certificate_type text NOT NULL CHECK (certificate_type IN ('winner', 'participant')),
  title text NOT NULL,
  description text,
  
  -- Issuing authority
  issued_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text NOT NULL,
  issued_by_org_name text,
  
  -- Verification and security
  verification_hash text UNIQUE NOT NULL,
  verification_status text DEFAULT 'verified' CHECK (verification_status IN (
    'verified', 'revoked', 'suspended'
  )),
  
  -- Timestamps
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  
  -- Additional metadata
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certificates_recipient_idx ON public.certificates(recipient_user_id);
CREATE INDEX IF NOT EXISTS certificates_safe_hire_id_idx ON public.certificates(recipient_safe_hire_id);
CREATE INDEX IF NOT EXISTS certificates_event_idx ON public.certificates(event_id);
CREATE INDEX IF NOT EXISTS certificates_verification_hash_idx ON public.certificates(verification_hash);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 11: UNIVERSITY RESULTS TABLE
-- Academic results with principal verification
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.university_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student information
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_safe_hire_id text NOT NULL,
  
  -- University and course details
  university_name text NOT NULL,
  university_code text,
  course_name text NOT NULL,
  academic_year text NOT NULL,
  semester_year text,
  
  -- Result details
  result_type text NOT NULL CHECK (result_type IN ('semester', 'annual', 'final', 'transcript')),
  grade_cgpa text,
  percentage numeric(5,2),
  division_class text,
  result_status text CHECK (result_status IN ('passed', 'failed', 'detained', 'promoted')),
  
  -- Document reference
  document_url text,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  
  -- Principal verification (digital signature)
  principal_name text,
  principal_designation text,
  principal_signature_hash text,
  principal_signature_timestamp timestamptz,
  principal_verification_status text DEFAULT 'pending' CHECK (
    principal_verification_status IN ('pending', 'approved', 'rejected', 'revoked')
  ),
  
  -- University verification
  university_verification_status text DEFAULT 'pending' CHECK (
    university_verification_status IN ('pending', 'verified', 'unverified', 'flagged')
  ),
  verified_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  
  -- Activation status (only active results visible to employers)
  is_active boolean DEFAULT false,
  activated_at timestamptz,
  
  -- Security and audit
  verification_hash text UNIQUE NOT NULL,
  immutable_record_hash text,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS university_results_student_idx ON public.university_results(student_user_id);
CREATE INDEX IF NOT EXISTS university_results_safe_hire_id_idx ON public.university_results(student_safe_hire_id);
CREATE INDEX IF NOT EXISTS university_results_university_idx ON public.university_results(university_name);
CREATE INDEX IF NOT EXISTS university_results_verification_hash_idx ON public.university_results(verification_hash);

ALTER TABLE public.university_results ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 12: UNIVERSITY PRINCIPALS TABLE
-- Authorized university principals for result verification
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.university_principals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Principal information
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  designation text NOT NULL,
  employee_id text,
  
  -- University affiliation
  university_name text NOT NULL,
  university_code text,
  department text,
  
  -- Digital signature
  digital_signature_hash text UNIQUE NOT NULL,
  public_key_pem text,
  signature_valid_from timestamptz NOT NULL DEFAULT now(),
  signature_valid_until timestamptz,
  
  -- Verification status
  verification_status text DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'verified', 'suspended', 'revoked')
  ),
  verified_by_authority text,
  verified_at timestamptz,
  
  -- Metadata
  contact_email text,
  contact_phone text,
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS university_principals_user_idx ON public.university_principals(user_id);
CREATE INDEX IF NOT EXISTS university_principals_university_idx ON public.university_principals(university_name);
CREATE INDEX IF NOT EXISTS university_principals_signature_hash_idx ON public.university_principals(digital_signature_hash);

ALTER TABLE public.university_principals ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 13: ACHIEVEMENT BADGES TABLE
-- Special achievements and milestones for gamification
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.achievement_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Badge details
  badge_name text NOT NULL,
  badge_category text CHECK (badge_category IN (
    'academic', 'event', 'skill', 'employment', 'community', 'other'
  )),
  badge_level text CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
  icon_url text,
  description text,
  
  -- Recipient
  recipient_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_safe_hire_id text NOT NULL,
  
  -- Issuer
  issued_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_org_name text,
  
  -- Verification
  verification_hash text UNIQUE,
  is_verified boolean DEFAULT false,
  
  -- Timestamps
  earned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS achievement_badges_recipient_idx ON public.achievement_badges(recipient_user_id);
CREATE INDEX IF NOT EXISTS achievement_badges_category_idx ON public.achievement_badges(badge_category);

ALTER TABLE public.achievement_badges ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created after all tables are defined

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 14: HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Function to generate verification hash for certificates and results
CREATE OR REPLACE FUNCTION public.generate_verification_hash(
  p_content text,
  p_salt text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_salt text;
BEGIN
  v_salt := COALESCE(p_salt, gen_random_uuid()::text);
  RETURN encode(digest(p_content || v_salt, 'sha256'), 'hex');
END;
$$;

-- Function to check if a principal can approve a result
CREATE OR REPLACE FUNCTION public.can_principal_approve_result(
  p_principal_user_id uuid,
  p_university_name text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.university_principals
    WHERE user_id = p_principal_user_id
      AND university_name = p_university_name
      AND verification_status = 'verified'
      AND (signature_valid_until IS NULL OR signature_valid_until > now())
  );
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 15: TRIGGERS FOR AUTO-INCREMENT CERTIFICATE COUNTS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.increment_event_certificate_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.events
  SET 
    total_certificates_issued = total_certificates_issued + 1,
    winner_certificates_issued = CASE 
      WHEN NEW.certificate_type = 'winner' THEN winner_certificates_issued + 1
      ELSE winner_certificates_issued
    END,
    participant_certificates_issued = CASE 
      WHEN NEW.certificate_type = 'participant' THEN participant_certificates_issued + 1
      ELSE participant_certificates_issued
    END
  WHERE id = NEW.event_id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_certificate_count ON public.certificates;

CREATE TRIGGER increment_certificate_count
  AFTER INSERT ON public.certificates
  FOR EACH ROW
  WHEN (NEW.event_id IS NOT NULL)
  EXECUTE FUNCTION public.increment_event_certificate_count();

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 16: UPDATE TIMESTAMP TRIGGERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_results_updated_at BEFORE UPDATE ON public.university_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_principals_updated_at BEFORE UPDATE ON public.university_principals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════════════════════════
-- STEP 17: ROW LEVEL SECURITY POLICIES
-- All policies defined here after all tables are created
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can read and update their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Employers can view profiles of applicants to their jobs
CREATE POLICY "profiles_employer_read_applicants"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications ap
      JOIN public.jobs j ON j.id = ap.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE ap.seeker_user_id = profiles.user_id
        AND c.owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- COMPANIES POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Company owner can CRUD their companies
CREATE POLICY "companies_owner_crud"
  ON public.companies FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Public read for verified companies (for job listings)
CREATE POLICY "companies_public_select"
  ON public.companies FOR SELECT
  USING (verification_status IN ('verified', 'demo'));

-- ─────────────────────────────────────────────────────────────────────────────
-- JOBS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Company owner can CRUD their jobs
CREATE POLICY "jobs_company_owner_all"
  ON public.jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = jobs.company_id AND c.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = jobs.company_id AND c.owner_user_id = auth.uid()
    )
  );

-- Public can read open jobs from verified companies
CREATE POLICY "jobs_public_read_open"
  ON public.jobs FOR SELECT
  USING (
    status = 'open' 
    AND EXISTS (
      SELECT 1 FROM public.companies c 
      WHERE c.id = jobs.company_id AND c.verification_status IN ('verified', 'demo')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- APPLICATIONS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Seekers can view and create their own applications
CREATE POLICY "applications_seeker_select_own"
  ON public.applications FOR SELECT
  USING (auth.uid() = seeker_user_id);

CREATE POLICY "applications_seeker_insert_own"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = seeker_user_id);

-- Company owners can view and update applications to their jobs
CREATE POLICY "applications_employer_select"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id AND c.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "applications_employer_update"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.companies c ON c.id = j.company_id
      WHERE j.id = applications.job_id AND c.owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- DOCUMENTS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can view and create their own documents
CREATE POLICY "documents_owner_select"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "documents_owner_insert"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Organizations can issue documents to others
CREATE POLICY "documents_org_insert"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = issued_by_user_id);

-- Employers can view documents of applicants to their jobs
CREATE POLICY "documents_employer_read_applicants"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications ap
      JOIN public.jobs j ON j.id = ap.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE ap.seeker_user_id = documents.user_id
        AND c.owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Organization can CRUD their events
CREATE POLICY "events_org_crud"
  ON public.events FOR ALL
  USING (auth.uid() = org_user_id)
  WITH CHECK (auth.uid() = org_user_id);

-- Public can view events
CREATE POLICY "events_public_select"
  ON public.events FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- CERTIFICATES POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Recipients can view their own certificates
CREATE POLICY "certificates_recipient_select"
  ON public.certificates FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Organizations can issue certificates
CREATE POLICY "certificates_org_insert"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = issued_by_user_id);

-- Organizations can update/revoke their issued certificates
CREATE POLICY "certificates_org_update"
  ON public.certificates FOR UPDATE
  USING (auth.uid() = issued_by_user_id)
  WITH CHECK (auth.uid() = issued_by_user_id);

-- Public read for verification purposes
CREATE POLICY "certificates_public_select"
  ON public.certificates FOR SELECT
  USING (verification_status = 'verified');

-- ─────────────────────────────────────────────────────────────────────────────
-- UNIVERSITY RESULTS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Students can view their own results
CREATE POLICY "university_results_student_select"
  ON public.university_results FOR SELECT
  USING (auth.uid() = student_user_id);

-- Universities/Organizations can insert results
CREATE POLICY "university_results_org_insert"
  ON public.university_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('organisation', 'university_principal', 'reviewer')
    )
  );

-- Universities can update their submitted results
CREATE POLICY "university_results_org_update"
  ON public.university_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('organisation', 'university_principal', 'reviewer')
    )
  );

-- Public read for verified and active results only
CREATE POLICY "university_results_public_select"
  ON public.university_results FOR SELECT
  USING (
    is_active = true 
    AND university_verification_status = 'verified'
    AND principal_verification_status = 'approved'
  );

-- Employers can view results of applicants to their jobs
CREATE POLICY "university_results_employer_read_applicants"
  ON public.university_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications ap
      JOIN public.jobs j ON j.id = ap.job_id
      JOIN public.companies c ON c.id = j.company_id
      WHERE ap.seeker_user_id = university_results.student_user_id
        AND c.owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- UNIVERSITY PRINCIPALS POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Principals can view and update their own record
CREATE POLICY "university_principals_own_select"
  ON public.university_principals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "university_principals_own_update"
  ON public.university_principals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can view verified principals
CREATE POLICY "university_principals_public_select"
  ON public.university_principals FOR SELECT
  USING (verification_status = 'verified');

-- ─────────────────────────────────────────────────────────────────────────────
-- ACHIEVEMENT BADGES POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Recipients can view their own badges
CREATE POLICY "achievement_badges_recipient_select"
  ON public.achievement_badges FOR SELECT
  USING (auth.uid() = recipient_user_id);

-- Organizations can issue badges
CREATE POLICY "achievement_badges_org_insert"
  ON public.achievement_badges FOR INSERT
  WITH CHECK (auth.uid() = issued_by_user_id);

-- Public can view verified badges
CREATE POLICY "achievement_badges_public_select"
  ON public.achievement_badges FOR SELECT
  USING (is_verified = true);

-- ══════════════════════════════════════════════════════════════════════════════
-- INSTALLATION COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════

-- Verify installation
SELECT 
  'Installation Complete!' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Show all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
