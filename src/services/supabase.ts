import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TestSuite } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEY = 'testgen_supabase_config_v1';

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    url: (import.meta as any).env?.VITE_SUPABASE_URL || '',
    anonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(config.url, config.anonKey);
  }
  return cachedClient;
};

export const resetSupabaseClient = () => {
  cachedClient = null;
};

export const testSupabaseConnection = async (config: SupabaseConfig): Promise<{ ok: boolean; message: string }> => {
  try {
    if (!config.url || !config.anonKey) {
      return { ok: false, message: 'Please provide both Supabase Project URL and Anon Key.' };
    }
    const client = createClient(config.url, config.anonKey);
    // Ping public table or auth
    const { error } = await client.from('test_suites').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "test_suites" does not exist')) {
      // If table doesn't exist yet, we still know authentication connected!
      return { ok: true, message: `Connected to Supabase! (Note: run schema.sql to create tables if needed)` };
    }
    return { ok: true, message: 'Successfully connected to Supabase database!' };
  } catch (err: any) {
    return { ok: false, message: err.message || 'Connection to Supabase failed.' };
  }
};

export const syncSuiteToSupabase = async (suite: TestSuite): Promise<{ ok: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Please set Project URL & Anon Key in Deploy Configs.');
  }

  // 1. Upsert Suite
  const suitePayload: any = {
    name: suite.name,
    module: suite.module,
    scenario_title: suite.scenarioTitle,
    version: suite.version,
    requirements_raw: suite.requirementsRaw,
    template_id: suite.templateId,
    updated_at: new Date().toISOString(),
  };

  // Only pass UUID if it conforms to standard UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(suite.id)) {
    suitePayload.id = suite.id;
  }

  const { data: savedSuite, error: suiteErr } = await client
    .from('test_suites')
    .upsert(suitePayload)
    .select('id')
    .single();

  if (suiteErr) {
    throw new Error(`Failed to save suite to Supabase: ${suiteErr.message}`);
  }

  const targetSuiteId = savedSuite?.id;

  // 2. Batch insert test cases
  if (targetSuiteId && suite.testCases && suite.testCases.length > 0) {
    const casesPayload = suite.testCases.map((tc, idx) => ({
      suite_id: targetSuiteId,
      tc_id: tc.id,
      step_order: tc.order || idx + 1,
      scenario: tc.scenario,
      scope: tc.scope || '',
      category: tc.category,
      priority: tc.priority,
      preconditions: tc.preconditions,
      steps: tc.steps,
      test_data: tc.testData,
      expected_result: tc.expectedResult,
      expectation: tc.expectation || tc.expectedResult,
      status: tc.status,
      mapped_requirement_ids: tc.mappedRequirementIds || [],
      notes: tc.notes || '',
    }));

    try {
      await client.from('test_cases').delete().eq('suite_id', targetSuiteId);
      await client.from('test_cases').insert(casesPayload);
    } catch (e) {
      console.warn('Test cases table sync note:', e);
    }
  }

  return { ok: true, message: `Suite "${suite.name}" and ${suite.testCases.length} test cases synchronized to Supabase Cloud!` };
};

export const fetchSuitesFromSupabase = async (): Promise<TestSuite[]> => {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data: dbSuites, error } = await client
    .from('test_suites')
    .select('*, test_cases(*)')
    .order('updated_at', { ascending: false });

  if (error || !dbSuites) return [];

  return dbSuites.map((s: any) => ({
    id: s.id,
    name: s.name,
    module: s.module,
    scenarioTitle: s.scenario_title || s.name,
    version: s.version || 1,
    requirementsRaw: s.requirements_raw || '',
    requirementsList: [],
    templateId: s.template_id || 'screenshot-template',
    createdAt: s.created_at || new Date().toISOString(),
    updatedAt: s.updated_at || new Date().toISOString(),
    history: [],
    testCases: (s.test_cases || []).map((tc: any, idx: number) => ({
      id: tc.tc_id || `TC-${String(idx + 1).padStart(3, '0')}`,
      order: tc.step_order || idx + 1,
      scenario: tc.scenario,
      scope: tc.scope || tc.scenario,
      category: tc.category || 'positive',
      priority: tc.priority || 'high',
      preconditions: tc.preconditions || 'None',
      steps: Array.isArray(tc.steps) ? tc.steps : ['Execute step'],
      testData: tc.test_data || 'N/A',
      expectedResult: tc.expected_result || '',
      expectation: tc.expectation || tc.expected_result || '',
      status: tc.status || 'passed',
      mappedRequirementIds: Array.isArray(tc.mapped_requirement_ids) ? tc.mapped_requirement_ids : [],
      sourceOrigin: 'historical_memory',
    })),
    traceabilityMatrix: [],
  }));
};

