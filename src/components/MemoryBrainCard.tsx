import React, { useState } from 'react';
import {
  Database,
  Search,
  Upload,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Tag,
  BookOpen,
  History,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { TestSuite, TestCase, RecalledMemory } from '../types';
import { searchHistoricalMemory } from '../services/storage';

interface MemoryBrainCardProps {
  suite: TestSuite;
  allSuites: TestSuite[];
  onMergeCases: (cases: TestCase[]) => void;
  onOpenImportModal: () => void;
  onOpenRequirementsModal: () => void;
}

export const MemoryBrainCard: React.FC<MemoryBrainCardProps> = ({
  suite,
  allSuites,
  onMergeCases,
  onOpenImportModal,
  onOpenRequirementsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState(suite.module || 'Shipment');
  const [mergedIds, setMergedIds] = useState<Set<string>>(new Set());

  // Search historical memory
  const recalledResults = searchHistoricalMemory(searchQuery, suite.id);

  // Total historical cases available across entire system
  const totalSystemCases = allSuites.reduce((acc, s) => acc + s.testCases.length, 0);

  const handleMergeSingle = (tc: TestCase) => {
    onMergeCases([
      {
        ...tc,
        id: `TC-REC-${String(suite.testCases.length + 1).padStart(3, '0')}`,
        order: suite.testCases.length + 1,
        sourceOrigin: 'historical_memory',
        diffType: 'recalled',
      },
    ]);
    setMergedIds((prev) => new Set([...prev, tc.id]));
  };

  const handleMergeAllFromMemory = (memory: RecalledMemory) => {
    const prepared = memory.historicalCases.map((tc, idx) => ({
      ...tc,
      id: `TC-REC-${String(suite.testCases.length + idx + 1).padStart(3, '0')}`,
      order: suite.testCases.length + idx + 1,
      sourceOrigin: 'historical_memory' as const,
      diffType: 'recalled' as const,
    }));
    onMergeCases(prepared);
    setMergedIds((prev) => new Set([...prev, ...memory.historicalCases.map((c) => c.id)]));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner / Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1b2233]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Memory Brain
              </span>
              <span className="text-xs text-slate-400">
                {allSuites.length} Suites Learned • {totalSystemCases} Historical Cases Grounded
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Domain Memory Recall & Historical Grounding
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1a2133] border border-[#202838] text-slate-200 transition"
            title="Import .xlsx, .csv, or .json test cases to teach the Memory Brain"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Import & Teach Brain</span>
          </button>
          <button
            onClick={onOpenRequirementsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with Memory</span>
          </button>
        </div>
      </div>

      {/* Memory Brain Search & Concept Grounding Bar */}
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span>Search Historical Memory by Domain / Ticket Keywords:</span>
          </label>
          <span className="text-[11px] text-slate-400">
            e.g. Try searching <button onClick={() => setSearchQuery('Shipment')} className="text-purple-400 underline hover:text-purple-300">Shipment</button>, <button onClick={() => setSearchQuery('Upload')} className="text-purple-400 underline hover:text-purple-300">Upload</button>, <button onClick={() => setSearchQuery('Webhook')} className="text-purple-400 underline hover:text-purple-300">Webhook</button>, or <button onClick={() => setSearchQuery('Carrier')} className="text-purple-400 underline hover:text-purple-300">Carrier</button>
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type domain concept, ticket feature, or module (e.g. 'shipment', 'tracking', 'boundary', 'auth')..."
            className="w-full bg-[#141824] border border-[#1e2638] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Recall Results */}
      {recalledResults.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Found <strong>{recalledResults.length}</strong> past test suites matching keywords:
            </span>
          </div>

          {recalledResults.map((memory) => (
            <div
              key={memory.suiteId}
              className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-5 shadow-lg space-y-4"
            >
              {/* Suite Header & Match Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1b2233]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{memory.suiteName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161c28] text-slate-300 border border-[#232c40]">
                      {memory.module}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-400">Matched tokens:</span>
                    {memory.matchedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleMergeAllFromMemory(memory)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Merge All ({memory.historicalCases.length}) into Suite</span>
                </button>
              </div>

              {/* Past Learnings & Regression Lessons */}
              {memory.pastLearnings && memory.pastLearnings.length > 0 && (
                <div className="bg-[#141824] rounded-xl p-3.5 border border-[#1e2638] space-y-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Past Bugs & Domain Learnings</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {memory.pastLearnings.map((lesson, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Historical Test Cases Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Recalled Test Cases ({memory.historicalCases.length})</span>
                  <span className="text-[10px] text-slate-400">Grounds current MR testing</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {memory.historicalCases.map((tc) => {
                    const isMerged = mergedIds.has(tc.id);
                    return (
                      <div
                        key={tc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#141824] border border-[#1e2638] hover:border-[#2b354d] transition text-xs"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#1c2333] text-purple-300 border border-purple-500/20">
                              {tc.id}
                            </span>
                            <span className="font-semibold text-white truncate">{tc.scenario}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {tc.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            <strong>Expected:</strong> {tc.expectedResult || tc.expectation}
                          </p>
                        </div>

                        <button
                          onClick={() => handleMergeSingle(tc)}
                          disabled={isMerged}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                            isMerged
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {isMerged ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 text-purple-400" />
                              <span>Add to Suite</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#10141d] border border-dashed border-[#1e2638] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Matching Historical Memory Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No stored suites currently match <code className="text-purple-300 font-mono">"{searchQuery}"</code>.
            You can generate a new suite for this domain, or import an existing Excel/CSV/JSON test suite to teach the Memory Brain.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Import Existing Test Cases</span>
            </button>
            <button
              onClick={() => setSearchQuery('Shipment')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1a2133] border border-[#202838] text-slate-200 transition"
            >
              <span>Load Sample "Shipment" Memory</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
