import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  Upload,
  Brain,
  FileText,
  AlertCircle,
  X,
  Check,
  RefreshCw,
  BookOpen,
  Layers,
  HelpCircle,
  GitMerge,
  Cpu,
  Search,
  Zap,
} from 'lucide-react';
import { TestSuite, ModelSettings, CustomTemplate, KnowledgeDocument, TicketPlatform } from '../types';
import { searchHistoricalMemory } from '../services/storage';

interface RequirementsEditorModalProps {
  suite: TestSuite;
  modelSettings: ModelSettings;
  template: CustomTemplate;
  knowledgeBase: KnowledgeDocument[];
  onGenerate: (params: {
    requirements: string;
    scenarioTitle: string;
    moduleName: string;
    ticketPlatform?: TicketPlatform;
    ticketKey?: string;
    historicalContext?: string;
    isIncrementalUpdate: boolean;
  }) => Promise<void>;
  onClose: () => void;
}

export const RequirementsEditorModal: React.FC<RequirementsEditorModalProps> = ({
  suite,
  modelSettings,
  template,
  knowledgeBase,
  onGenerate,
  onClose,
}) => {
  const [platform, setPlatform] = useState<TicketPlatform>(suite.ticketPlatform || 'gitlab');
  const [ticketKey, setTicketKey] = useState(suite.ticketKey || '!384');
  const [requirements, setRequirements] = useState(suite.requirementsRaw || '');
  const [scenarioTitle, setScenarioTitle] = useState(suite.scenarioTitle || suite.name);
  const [moduleName, setModuleName] = useState(suite.module || 'Shipment');
  const [isIncrementalUpdate, setIsIncrementalUpdate] = useState(suite.testCases.length > 0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocs = knowledgeBase.filter((k) => k.isActive);

  // Live historical memory search based on current inputs
  const recalledMemories = useMemo(() => {
    const query = `${moduleName} ${scenarioTitle} ${requirements}`.slice(0, 300);
    return searchHistoricalMemory(query, suite.id);
  }, [moduleName, scenarioTitle, requirements, suite.id]);

  const totalRecalledCases = recalledMemories.reduce((sum, m) => sum + m.recalledCasesCount, 0);

  // Sample Loaders for Quick Tester Testing
  const loadShipmentMRSample = () => {
    setPlatform('gitlab');
    setTicketKey('MR-!412');
    setModuleName('Logistics & Shipment');
    setScenarioTitle('GitLab MR !412: Multi-Carrier Tracking Retry & Postal Code Normalization');
    setRequirements(`# GitLab Merge Request: !412
## Source Branch: feature/carrier-retry-webhook -> main
## Related Issue: #1420 - High error rate on international shipments during DHL carrier maintenance

### Context & Fix:
When DHL Express or FedEx returns HTTP 500/503 during carrier maintenance windows, the shipment tracker must execute an exponential backoff retry (1s, 2s, 4s, 8s, up to 5 attempts) before marking status as "Delivery Delayed".

### Acceptance Criteria:
1. Webhook and REST poller must implement circuit-breaker and exponential jittered backoff.
2. If carrier returns 5xx, do NOT drop the event; queue in Redis retry stream with attempt counter.
3. International postal codes (UK: "SW1A 1AA", Canada: "M5V 2T6") must be normalized with stripped whitespace and uppercase formatting.
4. Edge Case: If order has already reached "Delivered", subsequent delayed webhooks with "In Transit" must be discarded (prevent reverse state transition).
5. Security: HMAC-SHA256 signature verification required on all incoming webhook payloads.`);
  };

  const loadJiraAuthSample = () => {
    setPlatform('jira');
    setTicketKey('SEC-892');
    setModuleName('Authentication & Security');
    setScenarioTitle('JIRA SEC-892: Multi-Factor Authentication & Refresh Token Expiration');
    setRequirements(`### JIRA Issue: SEC-892
**Issue Type:** Story
**Epic:** Identity & Access Management (IAM)

**Description:**
As a security compliance officer,
I need users with Admin or Billing roles to be prompted for TOTP/MFA upon logging in from an unrecognized IP address, and enforce refresh token revocation upon password change.

**Acceptance Criteria:**
- Unrecognized IP triggers 6-digit TOTP challenge with 3-minute expiration.
- Maximum 3 incorrect TOTP attempts before account is locked for 15 minutes.
- Corner case: Token refresh request with expired refresh token must return HTTP 401 with code "TOKEN_EXPIRED".
- Boundary case: Password length strictly between 8 and 64 characters with at least 1 symbol and 1 number.
- UI: Show accessible error banner with countdown timer for locked accounts.`);
  };

  const loadServiceNowSample = () => {
    setPlatform('cyber');
    setTicketKey('INC-7049');
    setModuleName('File Management');
    setScenarioTitle('Cyber Ticket INC-7049: Boundary Upload Limit & Anti-Malware MIME Check');
    setRequirements(`### Cyber / ServiceNow Ticket: INC-7049
**Priority:** High
**Category:** Security & Storage

**User Story:**
Validate that uploaded requirement attachments adhere strictly to the 25.0 MB boundary limit and undergo magic-byte MIME type inspection to block disguised executable files (.exe renamed to .pdf).

**Acceptance Criteria:**
- Files <= 25,000,000 bytes accepted.
- Files >= 25,000,001 bytes rejected client-side and server-side.
- Inspect magic bytes (first 4 bytes) to verify PDF (%PDF) or PNG/JPEG header.
- Reject polyglot files containing embedded scripts.
- Display accessible WCAG 2.1 AA alert toast with explicit allowed size.`);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRequirements(content);
        if (!scenarioTitle || scenarioTitle === 'New Test Suite') {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setScenarioTitle(cleanName);
        }
      }
    };
    reader.readAsText(file);
  };

  // Submit & Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!requirements || !requirements.trim()) {
      setErrorMessage('Please enter requirement text, a user story, or upload a specification document.');
      return;
    }

    if (requirements.trim().length < 15) {
      setErrorMessage('The requirement is too short. Please provide at least 15 characters describing the feature or rule.');
      return;
    }

    // Build historical context from recalled memories
    let historicalContextText = '';
    if (recalledMemories.length > 0) {
      historicalContextText = recalledMemories
        .map(
          (m) =>
            `[Recalled Past Suite: ${m.suiteName} (${m.module})]\n` +
            `Matched Keywords: ${m.matchedKeywords.join(', ')}\n` +
            `Past Learnings: ${m.pastLearnings.join('; ')}\n` +
            `Key Historical Cases:\n` +
            m.historicalCases
              .slice(0, 4)
              .map((c) => `- ${c.id}: ${c.scenario} -> Expected: ${c.expectedResult}`)
              .join('\n')
        )
        .join('\n\n');
    }

    try {
      setIsGenerating(true);
      await onGenerate({
        requirements: requirements.trim(),
        scenarioTitle: scenarioTitle.trim() || 'Feature Specification',
        moduleName: moduleName.trim() || 'General',
        ticketPlatform: platform,
        ticketKey: ticketKey.trim(),
        historicalContext: historicalContextText,
        isIncrementalUpdate,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed. Please verify API configuration or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#1b2233] bg-[#0c0f17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Test Case Generator & 4-Section Review Engine
              </h3>
              <p className="text-[11px] text-slate-400">
                Section 1 (Template) • Section 2 (MR Fix Analysis) • Section 3 (Tester Questions) • Section 4 (Full Test Cases)
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Validation Notice</div>
                <div className="text-[11px] mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Ticket Platform Selector & Sample Loaders */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ticket / MR Source Platform:</span>
              </label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-500">Quick Samples:</span>
                <button
                  type="button"
                  onClick={loadShipmentMRSample}
                  className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 font-medium"
                >
                  GitLab Shipment MR
                </button>
                <button
                  type="button"
                  onClick={loadJiraAuthSample}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-medium"
                >
                  Jira Auth
                </button>
                <button
                  type="button"
                  onClick={loadServiceNowSample}
                  className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 font-medium"
                >
                  Cyber Upload
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'gitlab', label: 'GitLab MR' },
                { id: 'jira', label: 'Jira Issue' },
                { id: 'cyber', label: 'Cyber / ServiceNow' },
                { id: 'linear', label: 'Linear' },
                { id: 'generic', label: 'Generic / Notes' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id as TicketPlatform)}
                  className={`p-2 rounded-lg font-medium text-xs border text-center transition ${
                    platform === p.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-[#141824] text-slate-400 border-[#1e2638] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Module, Ticket Key & Scenario Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Module / Epic
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g. Logistics & Shipment, Auth"
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                MR / Ticket ID
              </label>
              <input
                type="text"
                value={ticketKey}
                onChange={(e) => setTicketKey(e.target.value)}
                placeholder="e.g. !384, PROD-1029"
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Scenario Focus / Title
              </label>
              <input
                type="text"
                value={scenarioTitle}
                onChange={(e) => setScenarioTitle(e.target.value)}
                placeholder="e.g. Carrier Webhook Retry"
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Requirement Text Editor + Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ticket Instructions, MR Description & Diff:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.json,.csv"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#1e2638] text-slate-300 border border-[#232c40] text-[11px] transition"
                >
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Upload Doc (.md, .txt)</span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  {requirements.length} chars
                </span>
              </div>
            </div>

            <textarea
              rows={8}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Paste the issue ticket description, GitLab MR instructions, or discussion here..."
              className="w-full bg-[#141824] border border-[#1e2638] rounded-xl p-3 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              required
            />
          </div>

          {/* Live Memory Brain Recall Indicator */}
          {recalledMemories.length > 0 && (
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-purple-300 text-xs">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>
                    Memory Brain Active: Found {recalledMemories.length} historical suite(s) with {totalRecalledCases} past cases
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                  Grounded Recall
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80">
                Matched past knowledge from <strong>{recalledMemories.map((m) => m.suiteName).join(', ')}</strong>.
                The AI will learn from earlier test scenarios, boundary validations, and bug history in this domain.
              </p>
            </div>
          )}

          {/* AI Brain Incremental Suite Diff Engine */}
          <div className="bg-[#141824] border border-[#1e2638] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Brain className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">AI Brain Memory & Incremental Suite Diff</div>
                  <div className="text-[10px] text-slate-400">
                    Preserves existing test case IDs and statuses, updates modified steps, and appends new cases for changed requirements.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIncrementalUpdate}
                  onChange={(e) => setIsIncrementalUpdate(e.target.checked)}
                  disabled={suite.testCases.length === 0}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {isIncrementalUpdate && (
              <div className="text-[11px] text-indigo-300 bg-indigo-950/30 p-2 rounded border border-indigo-800/40 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>
                  Memory Active: Will preserve your {suite.testCases.length} existing test cases while adapting changed rules.
                </span>
              </div>
            )}
          </div>

          {/* Active Grounding Context & Auto-Failover status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#141824] border border-[#1e2638]">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                Knowledge: <strong className="text-slate-200">{activeDocs.length} Guides</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#141824] border border-[#1e2638]">
              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">
                Template: <strong className="text-slate-200">{template.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                Auto-Failover: <strong>Active (Zero Quota Outage)</strong>
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1b2233]">
            <div className="text-[11px] text-slate-400">
              Primary Agent:{' '}
              <span className="text-indigo-400 font-semibold uppercase">
                {modelSettings.provider} ({modelSettings.modelName})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Synthesizing 4 Sections...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isIncrementalUpdate ? 'Update Suite with Memory' : 'Generate Full 4-Section Suite'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
