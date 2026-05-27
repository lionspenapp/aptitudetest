-- Curriculum seed data for InScribe

INSERT INTO curriculum_profiles (id, name, framework) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Middle School Science', 'NGSS'),
  ('a1000000-0000-4000-8000-000000000002', 'High School Honors', 'State Standards'),
  ('a1000000-0000-4000-8000-000000000003', 'AP Biology', 'College Board AP'),
  ('a1000000-0000-4000-8000-000000000004', 'IB Biology', 'International Baccalaureate');

-- Middle School Science (NGSS)
INSERT INTO curriculum_units (profile_id, unit_number, title) VALUES
  ('a1000000-0000-4000-8000-000000000001', 1, 'Matter and Its Interactions'),
  ('a1000000-0000-4000-8000-000000000001', 2, 'Ecosystems and Energy Flow'),
  ('a1000000-0000-4000-8000-000000000001', 3, 'Earth Systems and Climate'),
  ('a1000000-0000-4000-8000-000000000001', 4, 'Waves and Electromagnetic Radiation'),
  ('a1000000-0000-4000-8000-000000000001', 5, 'Structure and Function of Living Systems');

-- High School Honors
INSERT INTO curriculum_units (profile_id, unit_number, title) VALUES
  ('a1000000-0000-4000-8000-000000000002', 1, 'Biochemistry and Macromolecules'),
  ('a1000000-0000-4000-8000-000000000002', 2, 'Cell Structure and Function'),
  ('a1000000-0000-4000-8000-000000000002', 3, 'Genetics and Heredity'),
  ('a1000000-0000-4000-8000-000000000002', 4, 'Evolution and Natural Selection'),
  ('a1000000-0000-4000-8000-000000000002', 5, 'Ecology and Environmental Science');

-- AP Biology (College Board Units 1-8)
INSERT INTO curriculum_units (profile_id, unit_number, title) VALUES
  ('a1000000-0000-4000-8000-000000000003', 1, 'Chemistry of Life'),
  ('a1000000-0000-4000-8000-000000000003', 2, 'Cell Structure and Function'),
  ('a1000000-0000-4000-8000-000000000003', 3, 'Cellular Energetics'),
  ('a1000000-0000-4000-8000-000000000003', 4, 'Cell Communication and Cell Cycle'),
  ('a1000000-0000-4000-8000-000000000003', 5, 'Heredity'),
  ('a1000000-0000-4000-8000-000000000003', 6, 'Gene Expression and Regulation'),
  ('a1000000-0000-4000-8000-000000000003', 7, 'Natural Selection'),
  ('a1000000-0000-4000-8000-000000000003', 8, 'Ecology');

-- IB Biology (core topics)
INSERT INTO curriculum_units (profile_id, unit_number, title) VALUES
  ('a1000000-0000-4000-8000-000000000004', 1, 'Cell Biology'),
  ('a1000000-0000-4000-8000-000000000004', 2, 'Molecular Biology'),
  ('a1000000-0000-4000-8000-000000000004', 3, 'Genetics'),
  ('a1000000-0000-4000-8000-000000000004', 4, 'Ecology and Conservation'),
  ('a1000000-0000-4000-8000-000000000004', 5, 'Evolution and Biodiversity'),
  ('a1000000-0000-4000-8000-000000000004', 6, 'Human Physiology');
