import React, { useState, useRef, useEffect } from 'react';
import {
  CheckSquare,
  Database,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
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
  MoreHorizontal,
  HelpCircle,
  GitMerge,
  ExternalLink,
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
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGoogleAuth = async () => {
    if (user) {
      setUserMenuOpen(!userMenuOpen);
      return;
    }
    try {
      setIsSigningIn(true);
      await googleSignIn();
    } catch (err: any) {
      alert(`Google Sign-In notice: ${err.message || 'Please check popup settings.'}`);
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
        return { label: 'Gemini 3.8 Flash', dot: 'bg-emerald-400', border: 'border-emerald-500/30' };
      case 'openai':
        return { label: modelSettings.modelName || 'GPT-4o', dot: 'bg-indigo-400', border: 'border-indigo-500/30' };
      case 'anthropic':
        return { label: modelSettings.modelName || 'Claude 3.7', dot: 'bg-amber-400', border: 'border-amber-500/30' };
      case 'ollama':
        return { label: `Local (${modelSettings.modelName || 'Ollama'})`, dot: 'bg-slate-400', border: 'border-slate-500/30' };
      default:
        return { label: 'AI Engine', dot: 'bg-gray-400', border: 'border-gray-500/30' };
    }
  };

  const badge = getProviderBadge();

  return (
    <header className="border-b border-[#181f2c] bg-[#0c0f17] sticky top-0 z-40 select-none">
      {/* Tier 1: Main Application Bar */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
        {/* Left Branding & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c28] border border-[#202838] transition"
            title="Toggle Scenarios Tree"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                TestGen <span className="text-indigo-400 font-bold">Pilot</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                QA Studio
              </span>
            </div>
          </div>

          {/* Active Suite Breadcrumb / Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121622] border border-[#1e2638] text-xs text-slate-400 truncate max-w-xs">
            <span className="text-slate-500 font-medium">{activeSuite.module}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold truncate">{activeSuite.name}</span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Model Selector Pill */}
          <button
            onClick={onOpenModelSettings}
            title="Switch AI Engine (Gemini, GPT-4, Claude, Local Ollama)"
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#131722] hover:bg-[#181e2e] border ${badge.border} transition`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
            <span className="text-slate-300">{badge.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* More Tools Dropdown Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              title="More QA Tools (Knowledge Base, Templates, Deploy & Supabase)"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-[#131722] hover:bg-[#181e2e] border border-[#1e2638] transition"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline text-slate-300">Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {toolsMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[#121622] border border-[#202838] shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenKnowledgeBase();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#181f2f] text-slate-200 flex items-center gap-2.5 transition"
                >
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-white">Knowledge Base</div>
                    <div className="text-[10px] text-slate-400">Ground AI on company QA guidelines</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenTemplateModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#181f2f] text-slate-200 flex items-center gap-2.5 transition"
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">Output Template</div>
                    <div className="text-[10px] text-slate-400">Select or upload custom Excel columns</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenDeployConfig();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#181f2f] text-slate-200 flex items-center gap-2.5 transition"
                >
                  <Cloud className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">Deploy & Supabase</div>
                    <div className="text-[10px] text-slate-400">Vercel setup & PostgreSQL sync</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenHistoryModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#181f2f] text-slate-200 flex items-center gap-2.5 transition"
                >
                  <History className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">v{activeSuite.version} Memory Diffs</div>
                    <div className="text-[10px] text-slate-400">Track changes and restore revisions</div>
                  </div>
                </button>

                <div className="my-1 border-t border-[#1e2638]" />

                <button
                  onClick={() => {
                    setToolsMenuOpen(false);
                    onOpenModelSettings();
                  }}
                  className="sm:hidden w-full text-left px-3 py-2 rounded-lg hover:bg-[#181f2f] text-slate-200 flex items-center gap-2.5 transition"
                >
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-white">Switch AI Engine</div>
                    <div className="text-[10px] text-slate-400">{badge.label}</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Import Button */}
          <button
            onClick={onOpenImportModal}
            title="Import existing test cases (.xlsx, .csv, .json) to teach Memory Brain"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-300 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 transition"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden xs:inline">Import</span>
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExportModal}
            title="Export to CSV, Google Sheets, Google Docs, or Drive"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-200 bg-[#161c28] hover:bg-[#1f2638] border border-[#202838] transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Export</span>
          </button>

          {/* Primary Action: Generate */}
          <button
            onClick={onOpenRequirementsModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>

          {/* Google Workspace Auth Button */}
          <div className="relative" ref={userMenuRef}>
            {user ? (
              <div className="flex items-center">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                  title={`Signed in as ${user.email}`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#121622] border border-[#202838] shadow-2xl p-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-[#1e2638]">
                      <div className="font-semibold text-white truncate">{user.displayName || 'Google User'}</div>
                      <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
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
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-[#131722] hover:bg-[#181e2e] border border-[#202838] transition"
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
                <span className="hidden sm:inline">{isSigningIn ? 'Connecting...' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tier 2: Dedicated 4-Section QA Workspace Tabs (Always Visible, Responsive Scroll) */}
      <div className="bg-[#090c12] border-t border-[#141b27] px-3 sm:px-4 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('test-cases')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'test-cases'
              ? 'bg-[#151c2c] text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Test Cases & Template</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1c2336] text-indigo-300 border border-indigo-500/20">
            {activeSuite.testCases.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mr-analysis')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'mr-analysis'
              ? 'bg-[#151c2c] text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f]'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5 text-cyan-400" />
          <span>MR Fix Analysis</span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
            Sec 2
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tester-questions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'tester-questions'
              ? 'bg-[#151c2c] text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Tester Inquiries</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
            {activeSuite.testerQuestions?.length || 4}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('memory-brain')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'memory-brain'
              ? 'bg-[#151c2c] text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>Historical Memory</span>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
            Recall
          </span>
        </button>

        <button
          onClick={() => setActiveTab('traceability-matrix')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'traceability-matrix'
              ? 'bg-[#151c2c] text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#10141f]'
          }`}
        >
          <Grid3X3 className="w-3.5 h-3.5 text-slate-400" />
          <span>RTCM Matrix</span>
        </button>
      </div>
    </header>
  );
};
