import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Plus,
  RefreshCw,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import { TestSuite, TestSuiteVersion, TestCase } from '../types';

interface DiffTimelineModalProps {
  suite: TestSuite;
  onRestoreVersion: (version: TestSuiteVersion) => void;
  onClose: () => void;
}

export const DiffTimelineModal: React.FC<DiffTimelineModalProps> = ({
  suite,
  onRestoreVersion,
  onClose,
}) => {
  const versions = suite.history || [];

  // Group current test cases by diffType
  const newCases = suite.testCases.filter((tc) => tc.diffType === 'new');
  const modifiedCases = suite.testCases.filter((tc) => tc.diffType === 'modified');
  const deprecatedCases = suite.testCases.filter((tc) => tc.diffType === 'deprecated');
  const unchangedCases = suite.testCases.filter(
    (tc) => !tc.diffType || tc.diffType === 'unchanged'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#1b2233] bg-[#0c0f17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                AI Suite Memory & Evolution History (v{suite.version})
              </h3>
              <p className="text-[11px] text-slate-400">
                Preserves IDs and execution statuses, adjusting test steps incrementally when requirements change.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Current Suite Diff Breakdown */}
          <div className="bg-[#141824] border border-[#1e2638] rounded-xl p-4">
            <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Latest Incremental Synthesis Diff
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  +{newCases.length}
                </div>
                <div className="text-[10px] text-emerald-300 font-medium">New Cases Added</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
                <div className="text-lg font-bold text-amber-400 font-mono">
                  ~{modifiedCases.length}
                </div>
                <div className="text-[10px] text-amber-300 font-medium">Steps Adjusted</div>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40">
                <div className="text-lg font-bold text-rose-400 font-mono">
                  -{deprecatedCases.length}
                </div>
                <div className="text-[10px] text-rose-300 font-medium">Deprecated</div>
              </div>
              <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40">
                <div className="text-lg font-bold text-indigo-300 font-mono">
                  {unchangedCases.length}
                </div>
                <div className="text-[10px] text-indigo-300 font-medium">Preserved Exact</div>
              </div>
            </div>

            {/* List Modified & New Cases if any */}
            {(newCases.length > 0 || modifiedCases.length > 0 || deprecatedCases.length > 0) && (
              <div className="mt-4 space-y-2 border-t border-[#1e2638] pt-3">
                <div className="text-[11px] font-semibold text-slate-300">Detailed Adjustments:</div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {newCases.map((tc) => (
                    <div
                      key={tc.id}
                      className="p-2 rounded bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-emerald-400">+{tc.id}</span>
                        <span className="text-slate-200 truncate">{tc.scenario}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-900/30">
                        New
                      </span>
                    </div>
                  ))}

                  {modifiedCases.map((tc) => (
                    <div
                      key={tc.id}
                      className="p-2 rounded bg-amber-950/20 border border-amber-800/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-amber-400">~{tc.id}</span>
                        <span className="text-slate-200 truncate">{tc.scenario}</span>
                        {tc.diffSummary && (
                          <span className="text-slate-400 text-[11px]">({tc.diffSummary})</span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-900/30">
                        Adjusted
                      </span>
                    </div>
                  ))}

                  {deprecatedCases.map((tc) => (
                    <div
                      key={tc.id}
                      className="p-2 rounded bg-rose-950/20 border border-rose-800/30 flex items-center justify-between line-through text-slate-500"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono font-bold text-rose-400">-{tc.id}</span>
                        <span className="truncate">{tc.scenario}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-rose-400 px-1.5 py-0.5 rounded bg-rose-900/30">
                        Deprecated
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historical Versions Timeline */}
          <div>
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Recorded Suite Revisions (FR-014)
            </h4>

            {versions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 bg-[#10141d] rounded-xl border border-[#1e2638]">
                Currently at initial revision v{suite.version}. Trigger an AI Brain Update to generate version checkpoints.
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver) => {
                  const isCurrent = ver.version === suite.version;
                  return (
                    <div
                      key={ver.version}
                      className={`p-4 rounded-xl border transition ${
                        isCurrent
                          ? 'bg-[#151a26] border-indigo-500/60'
                          : 'bg-[#10141d] border-[#1e2638] hover:border-[#28354f]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            v{ver.version}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {ver.changeSummary || `Revision ${ver.version}`}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {new Date(ver.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {ver.requirementsRaw && (
                        <div className="p-2.5 rounded bg-[#0a0d14] font-mono text-[11px] text-slate-400 line-clamp-2 mb-3">
                          {ver.requirementsRaw}
                        </div>
                      )}

                      {!isCurrent && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => onRestoreVersion(ver)}
                            className="px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2133] text-slate-200 border border-[#202838] font-semibold text-xs flex items-center gap-1.5 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Rollback to v{ver.version}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#1b2233] bg-[#0c0f17] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
