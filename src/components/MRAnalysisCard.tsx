import React, { useState } from 'react';
import {
  GitMerge,
  AlertTriangle,
  Layers,
  Cpu,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  Terminal,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { MRAnalysis, TestSuite } from '../types';

interface MRAnalysisCardProps {
  suite: TestSuite;
  onOpenRequirementsModal: () => void;
}

export const MRAnalysisCard: React.FC<MRAnalysisCardProps> = ({ suite, onOpenRequirementsModal }) => {
  const [copied, setCopied] = useState(false);

  const analysis: MRAnalysis = suite.mrAnalysis || {
    actualFixSummary:
      'No explicit MR analysis generated yet. Click "Generate" to synthesize Section 2 for this ticket or Merge Request.',
    rootCause: 'Analysis pending next AI generation run.',
    impactedComponents: ['api/routes', 'services/core', 'db/schema'],
    regressionRisks: ['Input boundary regression', 'State management desynchronization'],
    architectureChanges: ['Async queue conversion', 'Idempotent cache keying'],
    suggestedAutomations: ['API integration test', 'End-to-end regression suite'],
  };

  const handleCopySummary = () => {
    const text = `### 📋 QA Review: What This MR / Fix is Addressing
**Summary:** ${analysis.actualFixSummary}

**Root Cause:**
${analysis.rootCause}

**Impacted Components:**
${analysis.impactedComponents.map((c) => `- \`${c}\``).join('\n')}

**Regression Risks:**
${analysis.regressionRisks.map((r) => `- ⚠️ ${r}`).join('\n')}

**Architecture Changes:**
${(analysis.architectureChanges || []).map((a) => `- ${a}`).join('\n')}

**Suggested Automation:**
${(analysis.suggestedAutomations || []).map((s) => `- ${s}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner / Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1b2233]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Section 2 of 4
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {suite.ticketKey || (suite.ticketPlatform ? `${suite.ticketPlatform.toUpperCase()} MR` : 'GitLab MR')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              What the Actual Fix / Merge Request is Doing
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1a2133] border border-[#202838] text-slate-200 transition"
            title="Copy formatted MR analysis for GitLab MR comment or Jira description"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{copied ? 'Copied Markdown' : 'Copy for MR Comment'}</span>
          </button>
          <button
            onClick={onOpenRequirementsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Regenerate Analysis</span>
          </button>
        </div>
      </div>

      {/* Main Fix Description Card */}
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
          <Code2 className="w-4 h-4" />
          <span>Core Intent & Fix Summary</span>
        </div>
        <p className="text-slate-100 text-sm leading-relaxed font-sans font-medium">
          {analysis.actualFixSummary}
        </p>
      </div>

      {/* Root Cause & Architecture Changes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Root Cause Card */}
        <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Root Cause Identified</span>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {analysis.rootCause}
          </p>
        </div>

        {/* Architecture & Protocol Changes */}
        <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Architecture & State Changes</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {analysis.architectureChanges && analysis.architectureChanges.length > 0 ? (
              analysis.architectureChanges.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#141824] p-2 rounded-lg border border-[#1e2638]">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic">No breaking schema or protocol shifts identified.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Impacted Components & File Paths */}
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Impacted Components & Subsystems ({analysis.impactedComponents.length})</span>
          </div>
          <span className="text-[11px] text-slate-400">Review git diff against these targets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {analysis.impactedComponents.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141824] border border-[#1e2638] font-mono text-xs text-slate-300 hover:border-indigo-500/40 transition"
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{comp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Regression Risks & Automated Test Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Regression Risks */}
        <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Regression Risks (Verify Carefully)</span>
          </div>
          <div className="space-y-2">
            {analysis.regressionRisks.map((risk, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-200 text-xs leading-relaxed"
              >
                <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  !
                </span>
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Automation Hooks */}
        <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Recommended Automation Hooks</span>
          </div>
          <div className="space-y-2">
            {analysis.suggestedAutomations && analysis.suggestedAutomations.length > 0 ? (
              analysis.suggestedAutomations.map((auto, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#141824] border border-[#1e2638] text-slate-300 text-xs leading-relaxed"
                >
                  <span className="text-indigo-400 font-bold shrink-0">→</span>
                  <span>{auto}</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-xs italic">Playwright/Cypress end-to-end regression recommended.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
