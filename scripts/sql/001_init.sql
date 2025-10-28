-- USERS PROFILE (links to auth.users by user_id)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('job_seeker','employer_admin','reviewer')) default 'job_seeker',
  full_name text,
  aadhaar_full_name text,
  aadhaar_verified boolean not null default false,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Allow users to read/update only their profile
create policy if not exists "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy if not exists "profiles_upsert_own"
  on public.profiles for insert with check (auth.uid() = user_id);

create policy if not exists "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- COMPANIES
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  registration_number text not null,
  verification_status text check (verification_status in ('pending','verified','failed')) default 'pending',
  verifier_source text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
alter table public.companies enable row level security;

-- Company data isolation: owner can CRUD their companies
create policy if not exists "companies_owner_crud"
  on public.companies for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- JOBS
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  requirements_json jsonb default '{}',
  status text check (status in ('draft','open','closed')) default 'open',
  created_at timestamp with time zone default now()
);
alter table public.jobs enable row level security;

-- Jobs visible to owner of company; public read of open jobs (optional)
create policy if not exists "jobs_company_owner_all"
  on public.jobs for all
  using (exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.companies c where c.id = jobs.company_id and c.owner_user_id = auth.uid()));

create policy if not exists "jobs_public_read_open"
  on public.jobs for select
  using (status = 'open');

-- APPLICATIONS
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  seeker_user_id uuid not null references auth.users(id) on delete cascade,
  safe_hire_id text,
  status text check (status in ('applied','verified','not_authentic','hired','rejected')) default 'applied',
  decision_reason text,
  created_at timestamp with time zone default now()
);
alter table public.applications enable row level security;

-- Seeker can see their applications; employer (owner of company) can see apps on their jobs
create policy if not exists "applications_seekers_read_own"
  on public.applications for select
  using (auth.uid() = seeker_user_id);

create policy if not exists "applications_seekers_insert_own"
  on public.applications for insert
  with check (auth.uid() = seeker_user_id);

create policy if not exists "applications_company_owner_read"
  on public.applications for select
  using (exists (
    select 1 from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = applications.job_id and c.owner_user_id = auth.uid()
  ));

-- VERIFICATIONS (audit evidence)
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references auth.users(id) on delete cascade,
  type text check (type in ('aadhaar','academic','company')) not null,
  provider text,
  status text check (status in ('pending','success','failed')) not null,
  evidence_ref text,
  created_at timestamp with time zone default now()
);
alter table public.verifications enable row level security;

create policy if not exists "verifications_subject_read"
  on public.verifications for select
  using (auth.uid() = subject_user_id);

create policy if not exists "verifications_subject_insert"
  on public.verifications for insert
  with check (auth.uid() = subject_user_id);

-- CREDENTIALS (encrypted VC JWTs and hashes) - minimal for now
create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  type text check (type in ('identity','academic','employer')) not null,
  vc_jwt_encrypted text not null,
  vc_hash text not null,
  expiry timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
alter table public.credentials enable row level security;

create policy if not exists "credentials_subject_read"
  on public.credentials for select
  using (subject_user_id = auth.uid());

create policy if not exists "credentials_subject_insert"
  on public.credentials for insert
  with check (subject_user_id = auth.uid());

-- ANCHORS (NFT anchoring metadata)
create table if not exists public.anchors (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete cascade,
  chain text,
  contract text,
  token_id text,
  cid text,
  tx_hash text,
  anchored_at timestamp with time zone
);
alter table public.anchors enable row level security;

create policy if not exists "anchors_subject_read"
  on public.anchors for select
  using (exists (select 1 from public.credentials cr where cr.id = anchors.credential_id and cr.subject_user_id = auth.uid()));

-- EXPLAINABILITY (summary-only)
create table if not exists public.explainability (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  gaps_json jsonb,
  summary_text text,
  created_at timestamp with time zone default now()
);
alter table public.explainability enable row level security;

-- Employer (company owner) can read explainability for their apps; seeker can read for own app
create policy if not exists "expl_seekers_read"
  on public.explainability for select
  using (exists (select 1 from public.applications a where a.id = explainability.application_id and a.seeker_user_id = auth.uid()));

create policy if not exists "expl_company_owner_read"
  on public.explainability for select
  using (exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.id = explainability.application_id and c.owner_user_id = auth.uid()
  ));

-- AUDIT LOG (read-only to subject or company owner)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details_json jsonb,
  created_at timestamp with time zone default now()
);
alter table public.audit_logs enable row level security;

create policy if not exists "audit_read_self_actor"
  on public.audit_logs for select
  using (actor_user_id = auth.uid());

-- Seed helper: ensure a profile exists for each auth user (to be used in app logic)
-- (Note: Application will upsert profiles on first login if missing)
