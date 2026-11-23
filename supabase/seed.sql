-- =============================================================================
-- OrGanap Seed Data
-- Initial recognized organizations and campus venues
-- =============================================================================

-- 1. Initial Organizations (KCP Recognized Student Organizations)
insert into public.organizations (name, acronym, slug, description, category, logo_url)
values
  ('Supreme Student Council', 'SSC', 'ssc', 'Mother organization governing all student organizations at KCP', 'student_government', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org1/logo/a804ad92-ef70-46dd-95d9-207d5fe98fee-SSC.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('The Loquitur', 'TL', 'loquitor', 'Official Student Publication of King''s College of the Philippines', 'special_interest', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org2/logo/b9cfff2e-bbe0-4e51-aeb2-681631a8e362-The_Loquitur.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('Gabay Ensemble', 'GE', 'gabay', 'College Cultural Group of KCP', 'cultural', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org3/logo/cb9b7ab2-d6fe-411c-9ae4-b429ca1dce00-Gabay_Ensemble.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('The Ruling Conquerors', 'TRC', 'ruling-conquerors', 'Official Sports Club of KCP', 'sports', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org4/logo/7108a1f9-06c3-4528-ab9e-924d26ac6bd8-Sports_Club.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('KCPEEP Facilitator', 'KCPEEP', 'psych-club', 'Student organization for Psychology learners and academic activities', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org5/logo/8ac3b571-e3a5-4a80-b213-aa09a67c51e4-KCPeer_Facilitators.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('College of Accountancy and Business Management SBO', 'CABM SBO', 'cabm-sbo', 'Student Body Organization for the College of Accountancy and Business Management', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org6/logo/e67bd7f1-5015-43ea-a0dd-78223e93b6d9-CABM_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('College of Criminal Justice Education SBO', 'CCJE SBO', 'ccje-sbo', 'Student Body Organization for the College of Criminal Justice Education', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org7/logo/73970f96-f0d5-45ba-b44e-01a2f09c7791-CCJE_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('College of Information Technology SBO', 'CIT SBO', 'cit-sbo', 'Student''s Academic League of Technology (S-ALT)', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org8/logo/f2a8f40b-26d1-4658-bd82-ae2ed3065370-S-ALT_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('College of Teacher Education and Liberal Arts SBO', 'CTELA SBO', 'ctela-sbo', 'Student Body Organization for CTELA', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org9/logo/1c208ef3-f471-4dcc-9718-4f18053876dd-CTELA_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80'),
  ('College of Theology SBO', 'COT SBO', 'theology-sbo', 'Student Body Organization for the College of Theology', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org10/logo/f3ec2844-b0db-4ec7-a34d-9a394c6ad112-COT_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80')
on conflict (slug) do nothing;

-- 2. Initial Venues
insert into public.venues (name, location, capacity, is_active)
values
  ('University Main Auditorium', 'Main Academic Building, 4th Floor', 500, true),
  ('Multi-Purpose Hall (MPH)', 'Student Center, Ground Floor', 250, true),
  ('Audio-Visual Room 1 (AVR 1)', 'Library Wing, 3rd Floor', 100, true),
  ('Audio-Visual Room 2 (AVR 2)', 'Science Complex, 2nd Floor', 80, true),
  ('University Gymnasium', 'Athletic Complex', 1200, true);
