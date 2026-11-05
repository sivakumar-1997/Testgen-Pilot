import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Settings,
  BookOpen,
  FileSpreadsheet,
  Download,
  Plus,
  Layers,
  Cpu,
  LogOut,
  ChevronDown,
  History,
  Grid3X3,
  CheckCircle2,
  Menu,
  Cloud,
  Upload,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ModelSettings, TestSuite } from '../types';
import { googleSignIn, logoutGoogle } from '../services/googleWorkspace';

export type AppTab = 'test-cases' | 'mr-analysis' | 'tester-questions' | 'memory-brain' | 'traceability-matrix';

interface HeaderProps {
  activeSuite: TestSuite;
  modelSettings: ModelSettings;
  user: User | null;
  onOpenRequirementsModal: () => void;
  onOpenModelSettings: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenExportModal: () => void;
  onOpenTemplateModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenDeployConfig: () => void;
  onOpenImportModal: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSuite,
  modelSettings,
  user,
  onOpenRequirementsModal,
  onOpenModelSettings,
  onOpenKnowledgeBase,
  onOpenExportModal,
  onOpenTemplateModal,
  onOpenHistoryModal,
  onOpenDeployConfig,
  onOpenImportModal,
  activeTab,
  setActiveTab,
  onToggleMobileSidebar,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleGoogleAuth = async () => {
    if (user) {
      setUserMenuOpen(!userMenuOpen);
      return;
    }
    try {
      setIsSigningIn(true);
      await googleSignIn();
    } catch (err: any) {
      alert(`Google Sign-In failed: ${err.message || 'Please verify popup permissions.'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setUserMenuOpen(false);
  };

  const getProviderBadge = () => {
    switch (modelSettings.provider) {
      case 'gemini':
        return { label: 'Gemini 3.8 Flash', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'openai':
        return { label: modelSettings.modelName || 'GPT-4o', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'anthropic':
        return { label: modelSettings.modelName || 'Claude 3.7', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
      case 'ollama':
        return { label: `Local (${modelSettings.modelName || 'Ollama'})`, bg: 'bg-slate-500/10 text-slate-300 border-slate-500/20' };
      default:
        return { label: 'AI Engine', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
  };

  const badge = getProviderBadge();

  return (
    <header className="border-b border-[#1a202c] bg-[#0c0f17]/95 backdrop-blur sticky top-0 z-40 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c28] border border-[#202838]"
          title="Toggle Scenario Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-600/30 shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
                TestGen <span className="text-indigo-400">Pilot</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden xs:inline">
                4-SECTION QA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
              {activeSuite.module} / <span className="text-slate-200 font-medium">{activeSuite.name}</span>
            </p>
          </div>
        </div>

        {/* 4-Section & Navigation Tabs */}
        <div className="hidden xl:flex items-center bg-[#131722] p-0.5 rounded-lg border border-[#1e2638] ml-2">
          <button
            onClick={() => setActiveTab('test-cases')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'test-cases'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Section 1 & 4: Full Test Cases formatted according to template"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Test Cases ({activeSuite.testCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mr-analysis')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'mr-analysis'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Section 2: What the MR is going to fix"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-300" />
            <span>MR Fix Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('tester-questions')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'tester-questions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Section 3: Questions to ask as a tester before sign-off"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tester Inquiries ({activeSuite.testerQuestions?.length || 4})</span>
          </button>

          <button
            onClick={() => setActiveTab('memory-brain')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'memory-brain'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Memory Brain & Historical Search Recall"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Memory Brain</span>
          </button>

          <button
            onClick={() => setActiveTab('traceability-matrix')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'traceability-matrix'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Requirements Traceability and Coverage Matrix (RTCM)"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>RTCM</span>
          </button>
        </div>
      </div>

      {/* Action Controls & Integrations */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Model Selector / Badge */}
        <button
          onClick={onOpenModelSettings}
          title="Switch AI model (Gemini, GPT-4, Claude, Local Ollama)"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition hover:opacity-90 ${badge.bg}`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{badge.label}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {/* AI Memory / History */}
        <button
          onClick={onOpenHistoryModal}
          title="Suite Evolution & Memory Diff"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
        >
          <History className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden xl:inline">v{activeSuite.version} Memory</span>
        </button>

        {/* Knowledge Base */}
        <button
          onClick={onOpenKnowledgeBase}
          title="Ground & Train AI on Reference QA Docs"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Knowledge Base</span>
        </button>

        {/* Template Selector / Uploader */}
        <button
          onClick={onOpenTemplateModal}
          title="Choose or Upload Template (.xlsx with multi-tab detection)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
        >
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Template</span>
        </button>

        {/* Import Test Cases into Memory Brain */}
        <button
          onClick={onOpenImportModal}
          title="Import existing test cases (.xlsx, .csv, .json) to teach the Memory Brain"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-purple-300 bg-[#161324] hover:bg-[#201a33] border border-purple-500/30 transition"
        >
          <Upload className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Import</span>
        </button>

        {/* Deploy & Cloud Configs (Vercel & Supabase) */}
        <button
          onClick={onOpenDeployConfig}
          title="Configure Vercel Deployment & Supabase Database"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
        >
          <Cloud className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline">Deploy / Supabase</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          title="Export to CSV, Google Sheets, Google Docs, or Drive"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xs:inline">Export</span>
        </button>

        {/* Generate / Edit Requirements Button (Primary Action) */}
        <button
          onClick={onOpenRequirementsModal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate</span>
        </button>

        {/* Google Workspace Auth Button */}
        <div className="relative">
          {user ? (
            <div className="flex items-center">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                title={`Signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                  </div>
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#141824] border border-[#202838] shadow-2xl p-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-[#1e2638]">
                    <div className="font-semibold text-white truncate">{user.displayName || 'Google User'}</div>
                    <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Google Workspace Active
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 mt-1 rounded-lg hover:bg-[#1a2133] text-rose-400 hover:text-rose-300 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
              title="Sign in with Google to enable 1-click Google Drive, Sheets, and Docs export"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span className="hidden md:inline">{isSigningIn ? 'Connecting...' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
