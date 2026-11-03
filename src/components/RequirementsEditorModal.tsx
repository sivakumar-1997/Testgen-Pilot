import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { TestSuite, ModelSettings, CustomTemplate, KnowledgeDocument } from '../types';

interface RequirementsEditorModalProps {
  suite: TestSuite;
  modelSettings: ModelSettings;
  template: CustomTemplate;
  knowledgeBase: KnowledgeDocument[];
  onGenerate: (params: {
    requirements: string;
    scenarioTitle: string;
    moduleName: string;
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
  const [requirements, setRequirements] = useState(suite.requirementsRaw || '');
  const [scenarioTitle, setScenarioTitle] = useState(suite.scenarioTitle || suite.name);
  const [moduleName, setModuleName] = useState(suite.module || 'Core');
  const [isIncrementalUpdate, setIsIncrementalUpdate] = useState(suite.testCases.length > 0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocs = knowledgeBase.filter((k) => k.isActive);

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

    try {
      setIsGenerating(true);
      await onGenerate({
        requirements: requirements.trim(),
        scenarioTitle: scenarioTitle.trim() || 'Feature Specification',
        moduleName: moduleName.trim() || 'General',
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
                AI Test Case Generator & Suite Memory
              </h3>
              <p className="text-[11px] text-slate-400">
                Analyze requirements, user stories, discussions, or Jira tickets to generate full RTCM coverage.
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

          {/* Module & Scenario Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Module / Epic
              </label>
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g. File Management, Authentication"
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
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
                placeholder="e.g. Upload file exceeding size limit"
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
                Requirement Specification / User Story / Ticket
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
              rows={9}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Enter requirement text, user story, or Jira acceptance criteria here..."
              className="w-full bg-[#141824] border border-[#1e2638] rounded-xl p-3 text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
              required
            />
          </div>

          {/* AI Brain Memory & Incremental Suite Diff Engine */}
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

          {/* Active Grounding Context */}
          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#141824] border border-[#1e2638]">
              <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                Knowledge Base: <strong className="text-slate-200">{activeDocs.length} Active Guides</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#141824] border border-[#1e2638]">
              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">
                Template: <strong className="text-slate-200">{template.name}</strong>
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1b2233]">
            <div className="text-[11px] text-slate-400">
              Target Engine:{' '}
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
                    <span>Synthesizing Suite...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isIncrementalUpdate ? 'Update Suite with Memory' : 'Generate Full Test Suite'}</span>
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
