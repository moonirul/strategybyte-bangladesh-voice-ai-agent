-- =============================================================================
-- ByteVoice Bangladesh — Idempotent Seed Script (Dhaka Dental Care Demo Clinic)
-- =============================================================================
-- Safe to run multiple times (ON CONFLICT DO NOTHING / DO UPDATE).

insert into public.clinics (id, name, slug, timezone, opening_hours)
values (
  '11111111-1111-4111-8111-111111111111',
  'Dhaka Dental Care',
  'dhaka-dental-care',
  'Asia/Dhaka',
  'শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে রাত ৮টা পর্যন্ত। শুক্রবার বন্ধ।'
)
on conflict (slug) do update set
  name = excluded.name,
  timezone = excluded.timezone,
  opening_hours = excluded.opening_hours,
  updated_at = now();

insert into public.doctors (id, clinic_id, full_name, specialty, active)
values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111111', 'Dr. Farzana Haque', 'General dentistry', true),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111111', 'Dr. Imran Kabir', 'Orthodontics', true)
on conflict (id) do nothing;

-- =============================================================================
-- Linking a Supabase Auth Reviewer Account (run after creating a user in Auth):
--
-- insert into public.profiles (id, clinic_id, full_name, role)
-- select id, '11111111-1111-4111-8111-111111111111', 'Clinic Reviewer', 'admin'
-- from auth.users
-- where email = 'your-reviewer-email@example.com'
-- on conflict (id) do update set clinic_id = excluded.clinic_id, role = excluded.role;
-- =============================================================================
