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
  const { error: suiteErr } = await client.from('test_suites').upsert({
    id: suite.id.length === 36 ? suite.id : undefined, // only pass if valid uuid
    name: suite.name,
    module: suite.module,
    scenario_title: suite.scenarioTitle,
    version: suite.version,
    requirements_raw: suite.requirementsRaw,
    template_id: suite.templateId,
    updated_at: new Date().toISOString(),
  });

  if (suiteErr) {
    throw new Error(`Failed to save suite to Supabase: ${suiteErr.message}`);
  }

  return { ok: true, message: `Suite "${suite.name}" synchronized with Supabase cloud!` };
};
