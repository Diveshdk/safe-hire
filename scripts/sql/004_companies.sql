-- Enable required extension
create extension if not exists pgcrypto;

-- Companies table
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  registration_number text not null,
  verification_status text not null default 'pending',
  verifier_source text,
  verified_at timestamptz,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- Helpful index
create index if not exists companies_owner_idx on public.companies(owner_user_id);

-- RLS
alter table public.companies enable row level security;

-- Policy: owner can CRUD own companies
create policy if not exists "companies_select_own"
  on public.companies for select
  using (auth.uid() = owner_user_id);

create policy if not exists "companies_insert_own"
  on public.companies for insert
  with check (auth.uid() = owner_user_id);

create policy if not exists "companies_update_own"
  on public.companies for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

create policy if not exists "companies_delete_own"
  on public.companies for delete
  using (auth.uid() = owner_user_id);
