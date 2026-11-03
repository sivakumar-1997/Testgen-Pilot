import React, { useState } from 'react';
import {
  Cloud,
  Database,
  Check,
  X,
  Copy,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
  Server,
  RefreshCw,
  Terminal,
  Users,
  GitBranch,
  Key,
  ArrowRight,
} from 'lucide-react';
import { TestSuite } from '../types';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  syncSuiteToSupabase,
  SupabaseConfig,
  resetSupabaseClient,
} from '../services/supabase';
import { downloadFile } from '../services/exportUtils';

interface DeployConfigModalProps {
  activeSuite: TestSuite;
  onClose: () => void;
}

export const DeployConfigModal: React.FC<DeployConfigModalProps> = ({
  activeSuite,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'supabase' | 'cross-account'>('cross-account');
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const vercelJsonCode = `{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`;

  const supabaseSqlCode = `-- Supabase Schema for TestGen Pilot RTCM
CREATE TABLE IF NOT EXISTS test_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  scenario_title TEXT,
  version INT DEFAULT 1,
  requirements_raw TEXT,
  template_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  status TEXT DEFAULT 'pending'
);

ALTER TABLE test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public test_suites access" ON test_suites FOR ALL USING (true);
CREATE POLICY "Public test_cases access" ON test_cases FOR ALL USING (true);`;

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseConfig);
    resetSupabaseClient();
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseConfig);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      saveSupabaseConfig(supabaseConfig);
      const res = await syncSuiteToSupabase(activeSuite);
      setSyncResult(res);
    } catch (err: any) {
      setSyncResult({ ok: false, message: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#1b2233] bg-[#0c0f17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cloud Deployment & Cross-Account Setup
              </h3>
              <p className="text-[11px] text-slate-400">
                Deploy with Vercel and Supabase across different Gmail / GitHub accounts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2133]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-[#1b2233] bg-[#0e111a] flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('cross-account')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'cross-account'
                ? 'border-indigo-500 text-white bg-[#151a26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Cross-Account Guide (Different Gmails)
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'vercel'
                ? 'border-indigo-500 text-white bg-[#151a26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 22.525H0l12-21.05 12 21.05z" />
            </svg>
            Vercel Config
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'supabase'
                ? 'border-emerald-500 text-white bg-[#151a26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            Supabase DB Config
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === 'cross-account' && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-300">
                <div className="font-bold text-sm text-white mb-1">
                  How to deploy when your GitHub, Vercel, and Supabase are on different Gmail accounts
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  It is completely normal to have your GitHub repo under one email (e.g. personal Gmail), Vercel under another (e.g. work or client Gmail), and Supabase on a third. Here are the two cleanest ways to connect them without having to move accounts.
                </p>
              </div>

              {/* Solution 1: GitHub Collaborator Invite */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#1e2638] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                    Method A: GitHub Collaborator Invite (Recommended for Auto-Deploy CI/CD)
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                    Automated
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Allow Vercel’s account to access the GitHub repo without transferring repository ownership.
                </p>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">Step 1:</span>
                    <span>
                      Log into <strong>GitHub (Gmail #1)</strong> where the repo lives. Go to <strong>Repository &gt; Settings &gt; Collaborators</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">Step 2:</span>
                    <span>
                      Click <strong>"Add people"</strong> and enter the GitHub username of the account linked to your <strong>Vercel (Gmail #2)</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">Step 3:</span>
                    <span>
                      Accept the invitation in Gmail #2.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-indigo-400 font-bold shrink-0">Step 4:</span>
                    <span>
                      Log into <strong>Vercel (Gmail #2)</strong>. Click <strong>"Add New..." &gt; "Project"</strong>. The invited repository will now be listed! Click <strong>"Import"</strong>.
                    </span>
                  </div>
                </div>
              </div>

              {/* Solution 2: Vercel CLI */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#1e2638] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                    Method B: Instant Vercel CLI (No GitHub Linking Required)
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800">
                    Direct Terminal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Deploy directly from your machine into the target Vercel account in under 30 seconds.
                </p>

                <div className="p-3 rounded-lg bg-[#0a0d14] border border-[#1b2233] font-mono text-[11px] space-y-1 text-slate-300">
                  <div className="text-slate-500"># 1. Install Vercel CLI globally</div>
                  <div className="text-indigo-300">npm i -g vercel</div>
                  <div className="text-slate-500 mt-2"># 2. Login directly to your target Vercel account (opens browser to choose Gmail #2)</div>
                  <div className="text-indigo-300">vercel login</div>
                  <div className="text-slate-500 mt-2"># 3. Deploy from the project root</div>
                  <div className="text-emerald-400">vercel --prod</div>
                </div>
              </div>

              {/* Solution 3: Wiring Supabase */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#1e2638] space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                  Connecting Supabase (from any Gmail account)
                </h4>
                <p className="text-[11px] text-slate-300">
                  Supabase connects via standard HTTPS API keys, meaning it doesn't matter which email was used to create the Supabase project:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg bg-[#0c0f17] border border-[#1a202c]">
                    <div className="font-bold text-emerald-400 mb-1">In Supabase Dashboard:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Log in and open your project.</li>
                      <li>Go to <strong>Project Settings &gt; API</strong>.</li>
                      <li>Copy the <strong>Project URL</strong> and <strong>anon / public key</strong>.</li>
                      <li>Go to <strong>SQL Editor</strong> and execute the provided <code>supabase/schema.sql</code>.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0c0f17] border border-[#1a202c]">
                    <div className="font-bold text-indigo-400 mb-1">In Vercel Dashboard (Gmail #2):</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Go to your project &gt; <strong>Settings &gt; Environment Variables</strong>.</li>
                      <li>Add <code>GEMINI_API_KEY</code> = <em>your Gemini API key</em></li>
                      <li>Add <code>VITE_SUPABASE_URL</code> = <em>copied Supabase URL</em></li>
                      <li>Add <code>VITE_SUPABASE_ANON_KEY</code> = <em>copied anon key</em></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-300">
                <div className="font-bold flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-indigo-400" />
                  Vercel Ready: `vercel.json` and Serverless Route (`/api/generate.ts`) Configured
                </div>
                <p className="text-[11px] text-slate-400">
                  This application includes a verified <code>vercel.json</code>, client SPA fallback, and dedicated serverless function adapter for production zero-downtime hosting.
                </p>
              </div>

              {/* vercel.json viewer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-300 font-mono text-[11px]">vercel.json</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(vercelJsonCode, 'vercel')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedCode === 'vercel' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === 'vercel' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => downloadFile(vercelJsonCode, 'vercel.json', 'application/json')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-[#0a0d14] border border-[#1b2233] text-indigo-300 font-mono text-[11px] overflow-x-auto">
                  {vercelJsonCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
                <div className="font-bold flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Supabase PostgreSQL Cloud Persistence
                </div>
                <p className="text-[11px] text-slate-400">
                  Connect your Supabase project to persist suites, test cases, and RTCM matrices in a managed PostgreSQL database with Row Level Security.
                </p>
              </div>

              {/* Supabase Form */}
              <form onSubmit={handleSaveSupabase} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      value={supabaseConfig.url}
                      onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Anon / Public API Key
                    </label>
                    <input
                      type="password"
                      value={supabaseConfig.anonKey}
                      onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                      placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                      className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1a2233] hover:bg-[#222c42] text-white font-semibold border border-[#28354f] transition flex items-center gap-1.5"
                    >
                      {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{isTesting ? 'Testing...' : 'Test & Save Connection'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncToSupabase}
                      disabled={isSyncing || !supabaseConfig.url}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                      <span>Sync Suite to Supabase</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadFile(supabaseSqlCode, 'supabase_schema.sql', 'text/sql')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Download schema.sql</span>
                  </button>
                </div>

                {/* Status Messages */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      testResult.ok
                        ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {testResult.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {syncResult && (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      syncResult.ok
                        ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border border-rose-800 text-rose-300'
                    }`}
                  >
                    {syncResult.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{syncResult.message}</span>
                  </div>
                )}
              </form>

              {/* SQL Schema Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-300 font-mono text-[11px]">
                    supabase/schema.sql (PostgreSQL Tables & RLS)
                  </span>
                  <button
                    onClick={() => handleCopy(supabaseSqlCode, 'sql')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    {copiedCode === 'sql' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'sql' ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#0a0d14] border border-[#1b2233] text-emerald-300/90 font-mono text-[11px] max-h-44 overflow-y-auto">
                  {supabaseSqlCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1b2233] bg-[#0c0f17] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
