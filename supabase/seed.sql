-- =============================================================================
-- OrGanap Seed Data
-- Initial recognized organizations and campus venues
-- =============================================================================

-- 1. Initial Organizations
insert into public.organizations (name, acronym, slug, description, category)
values
  ('Computer Science Society', 'CSS', 'css', 'The academic organization for Computer Science students.', 'academic'),
  ('Junior Philippine Institute of Accountants', 'JPIA', 'jpia', 'The premier association for aspiring professional accountants.', 'academic'),
  ('Student Supreme Council', 'SSC', 'ssc', 'The highest student governing body of the university.', 'student_government'),
  ('University Cultural Guild', 'UCG', 'ucg', 'Fostering cultural preservation, dance, music, and dramatic arts.', 'cultural'),
  ('Red Cross Youth', 'RCY', 'rcy', 'Humanitarian voluntary service and community health promotion.', 'service')
on conflict (slug) do nothing;

-- 2. Initial Venues
insert into public.venues (name, location, capacity, is_active)
values
  ('University Main Auditorium', 'Main Academic Building, 4th Floor', 500, true),
  ('Multi-Purpose Hall (MPH)', 'Student Center, Ground Floor', 250, true),
  ('Audio-Visual Room 1 (AVR 1)', 'Library Wing, 3rd Floor', 100, true),
  ('Audio-Visual Room 2 (AVR 2)', 'Science Complex, 2nd Floor', 80, true),
  ('University Gymnasium', 'Athletic Complex', 1200, true);
