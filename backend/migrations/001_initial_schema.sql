-- =============================================================================
-- ByteVoice Bangladesh — PostgreSQL / Supabase Initial Schema & RLS Migration
-- =============================================================================
-- Run in Supabase SQL Editor or via migration runner.
-- Enforces relational integrity, constrained status enums, clinic-level
-- isolation, and Row-Level Security (RLS).

create extension if not exists "pgcrypto";

-- 1. clinics
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Asia/Dhaka',
  opening_hours text not null,
  contact_phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. profiles (links Supabase auth.users to a specific clinic & role)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  full_name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff', 'viewer')),
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_clinic_id on public.profiles(clinic_id);

-- 3. doctors
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  specialty text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_doctors_clinic_id on public.doctors(clinic_id);

-- 4. patients
-- Unique partial index on (clinic_id, phone_e164) prevents duplicate verified
-- patients per clinic while permitting unverified callers with null phone_e164.
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null,
  phone_e164 text check (phone_e164 is null or phone_e164 ~ '^\+8801[3-9][0-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patients_clinic_id on public.patients(clinic_id);
create unique index if not exists uq_patients_clinic_phone
  on public.patients(clinic_id, phone_e164)
  where phone_e164 is not null;

-- 5. calls
create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  provider text not null check (provider in ('demo', 'vapi')),
  provider_call_id text,
  call_mode text not null check (call_mode in ('demo', 'live')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  status text not null check (status in ('initiated', 'in_progress', 'completed', 'failed', 'abandoned')),
  outcome text check (outcome is null or outcome in ('appointment_requested', 'faq_answered', 'followup_required', 'incomplete', 'no_action')),
  recording_url text,
  created_at timestamptz not null default now(),
  unique (clinic_id, provider, provider_call_id)
);

create index if not exists idx_calls_clinic_started on public.calls(clinic_id, started_at desc);
create index if not exists idx_calls_patient_id on public.calls(patient_id);

-- 6. call_extractions
-- Added preferred_date_text to preserve the caller's exact spoken Bangla phrase
-- alongside parsed preferred_date and preferred_time.
create table if not exists public.call_extractions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null unique references public.calls(id) on delete cascade,
  intent text,
  reason_for_visit text,
  preferred_date_text text,
  preferred_date date,
  preferred_time time,
  preferred_datetime timestamptz,
  preferred_doctor text,
  patient_name_confirmed boolean not null default false,
  phone_confirmed boolean not null default false,
  booking_status text not null default 'none' check (booking_status in ('none', 'requested', 'confirmed', 'declined')),
  requires_human_followup boolean not null default false,
  confidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. transcript_turns
create table if not exists public.transcript_turns (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.calls(id) on delete cascade,
  sequence_number integer not null check (sequence_number >= 0),
  speaker text not null check (speaker in ('assistant', 'caller')),
  text_bn text not null,
  text_en text,
  timestamp_ms integer check (timestamp_ms is null or timestamp_ms >= 0),
  created_at timestamptz not null default now(),
  unique (call_id, sequence_number)
);

create index if not exists idx_transcript_turns_call_seq on public.transcript_turns(call_id, sequence_number);

-- 8. appointments
-- Constraint ensures an appointment can never be 'confirmed' without a scheduled_start timestamp.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  call_id uuid unique references public.calls(id) on delete set null,
  doctor_id uuid references public.doctors(id) on delete set null,
  requested_preference text,
  scheduled_start timestamptz,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')),
  booking_reference text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_confirmed_requires_schedule check (status <> 'confirmed' or scheduled_start is not null)
);

create index if not exists idx_appointments_clinic_status on public.appointments(clinic_id, status);

-- 9. follow_up_requests
create table if not exists public.follow_up_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  call_id uuid unique not null references public.calls(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete set null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'cancelled')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_followups_clinic_status on public.follow_up_requests(clinic_id, status);

-- =============================================================================
-- Row-Level Security (RLS) & Clinic Isolation Helper
-- =============================================================================

create or replace function public.current_user_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.profiles where id = auth.uid()
$$;

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.patients enable row level security;
alter table public.calls enable row level security;
alter table public.call_extractions enable row level security;
alter table public.transcript_turns enable row level security;
alter table public.appointments enable row level security;
alter table public.follow_up_requests enable row level security;

drop policy if exists clinics_select_own on public.clinics;
create policy clinics_select_own on public.clinics
  for select using (id = public.current_user_clinic_id());

drop policy if exists profiles_select_own_clinic on public.profiles;
create policy profiles_select_own_clinic on public.profiles
  for select using (clinic_id = public.current_user_clinic_id());

drop policy if exists doctors_select_own_clinic on public.doctors;
create policy doctors_select_own_clinic on public.doctors
  for select using (clinic_id = public.current_user_clinic_id());

drop policy if exists patients_clinic_isolation on public.patients;
create policy patients_clinic_isolation on public.patients
  for all using (clinic_id = public.current_user_clinic_id())
  with check (clinic_id = public.current_user_clinic_id());

drop policy if exists calls_clinic_isolation on public.calls;
create policy calls_clinic_isolation on public.calls
  for all using (clinic_id = public.current_user_clinic_id())
  with check (clinic_id = public.current_user_clinic_id());

drop policy if exists call_extractions_clinic_isolation on public.call_extractions;
create policy call_extractions_clinic_isolation on public.call_extractions
  for all using (
    exists (
      select 1 from public.calls c
      where c.id = call_extractions.call_id
        and c.clinic_id = public.current_user_clinic_id()
    )
  );

drop policy if exists transcript_turns_clinic_isolation on public.transcript_turns;
create policy transcript_turns_clinic_isolation on public.transcript_turns
  for all using (
    exists (
      select 1 from public.calls c
      where c.id = transcript_turns.call_id
        and c.clinic_id = public.current_user_clinic_id()
    )
  );

drop policy if exists appointments_clinic_isolation on public.appointments;
create policy appointments_clinic_isolation on public.appointments
  for all using (clinic_id = public.current_user_clinic_id())
  with check (clinic_id = public.current_user_clinic_id());

drop policy if exists followups_clinic_isolation on public.follow_up_requests;
create policy followups_clinic_isolation on public.follow_up_requests
  for all using (clinic_id = public.current_user_clinic_id())
  with check (clinic_id = public.current_user_clinic_id());
