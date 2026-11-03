-- Supabase Database Schema for TestGen Pilot RTCM Application
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Test Suites Table
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  scenario_title TEXT,
  version INT DEFAULT 1,
  requirements_raw TEXT,
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Requirements Table
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  req_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'functional',
  priority TEXT DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Test Cases Table
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  tc_id TEXT NOT NULL,
  step_order INT DEFAULT 1,
  scenario TEXT NOT NULL,
  scope TEXT,
  category TEXT DEFAULT 'positive',
  priority TEXT DEFAULT 'high',
  preconditions TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  test_data TEXT,
  expected_result TEXT,
  expectation TEXT,
  status TEXT DEFAULT 'pending',
  mapped_requirement_ids JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Traceability Matrix Table
CREATE TABLE IF NOT EXISTS traceability_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite_id UUID REFERENCES test_suites(id) ON DELETE CASCADE,
  req_id TEXT NOT NULL,
  req_title TEXT NOT NULL,
  mapped_test_case_ids JSONB DEFAULT '[]'::jsonb,
  coverage_status TEXT DEFAULT 'fully_covered',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Indexes for High-Speed Queries
CREATE INDEX IF NOT EXISTS idx_test_cases_suite_id ON test_cases(suite_id);
CREATE INDEX IF NOT EXISTS idx_requirements_suite_id ON requirements(suite_id);
CREATE INDEX IF NOT EXISTS idx_traceability_suite_id ON traceability_matrix(suite_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE traceability_matrix ENABLE ROW LEVEL SECURITY;

-- 8. Policies for Anon/Public Access (Adjust as needed for user-authenticated systems)
CREATE POLICY "Allow public read access to test_suites" ON test_suites FOR SELECT USING (true);
CREATE POLICY "Allow public insert to test_suites" ON test_suites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to test_suites" ON test_suites FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to test_suites" ON test_suites FOR DELETE USING (true);

CREATE POLICY "Allow public access to test_cases" ON test_cases FOR ALL USING (true);
CREATE POLICY "Allow public access to requirements" ON requirements FOR ALL USING (true);
CREATE POLICY "Allow public access to traceability_matrix" ON traceability_matrix FOR ALL USING (true);
