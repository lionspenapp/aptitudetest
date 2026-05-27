-- Archive Lion's Pen tables (replaced by InScribe)
DROP POLICY IF EXISTS "Questions are publicly readable" ON questions;
DROP POLICY IF EXISTS "Users can view their own student record" ON students;
DROP POLICY IF EXISTS "Users can insert their own student record" ON students;
DROP POLICY IF EXISTS "Users can view their own sessions" ON assessment_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON assessment_sessions;

DROP TABLE IF EXISTS assessment_sessions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS students;
