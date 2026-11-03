import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { TestSuite, TestCase, TraceabilityMapping } from '../types';

interface TraceabilityMatrixViewProps {
  suite: TestSuite;
  onSelectTestCase?: (tc: TestCase) => void;
}

export const TraceabilityMatrixView: React.FC<TraceabilityMatrixViewProps> = ({
  suite,
  onSelectTestCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const totalRequirements = suite.requirementsList.length;
  const fullyCovered = suite.traceabilityMatrix.filter((m) => m.coverageStatus === 'fully_covered').length;
  const uncovered = suite.traceabilityMatrix.filter((m) => m.coverageStatus === 'uncovered').length;
  const coveragePercent =
    totalRequirements > 0 ? Math.round((fullyCovered / totalRequirements) * 100) : 100;

  // Breakdown of test cases by category
  const categoryCounts = suite.testCases.reduce((acc, tc) => {
    acc[tc.category] = (acc[tc.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredMatrix = suite.traceabilityMatrix.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.reqId.toLowerCase().includes(q) ||
      item.reqTitle.toLowerCase().includes(q) ||
      item.mappedTestCaseIds.some((id) => id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0e14] text-slate-200">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* RTCM Overview Banner */}
        <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                  Traceability Matrix
                </span>
                <span className="text-xs text-slate-400 font-mono">Suite: {suite.name}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Requirements Traceability & Coverage Matrix (RTCM)
              </h2>
              <p className="text-xs text-slate-400 max-w-xl mt-1">
                Ensures every functional requirement and boundary case is verified by automated test cases.
              </p>
            </div>

            {/* Coverage Meter */}
            <div className="flex items-center gap-4 bg-[#0a0d14] border border-[#1b2233] rounded-xl p-3.5">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                  {coveragePercent}%
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                  Coverage
                </div>
              </div>
              <div className="h-8 w-px bg-[#1e2638]"></div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{fullyCovered} Covered</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                  {uncovered > 0 ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{uncovered} Gaps</span>
                </div>
              </div>
            </div>
          </div>

          {/* Test Coverage Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mt-5 pt-4 border-t border-[#1a202c]">
            {[
              { label: 'Positive', key: 'positive', count: categoryCounts['positive'] || 0, color: 'text-emerald-400 border-emerald-500/20' },
              { label: 'Negative', key: 'negative', count: categoryCounts['negative'] || 0, color: 'text-rose-400 border-rose-500/20' },
              { label: 'Boundary', key: 'boundary', count: categoryCounts['boundary'] || 0, color: 'text-amber-400 border-amber-500/20' },
              { label: 'Edge Case', key: 'edge', count: categoryCounts['edge'] || 0, color: 'text-orange-400 border-orange-500/20' },
              { label: 'Corner', key: 'corner', count: categoryCounts['corner'] || 0, color: 'text-purple-400 border-purple-500/20' },
              { label: 'Accessibility', key: 'accessibility', count: categoryCounts['accessibility'] || 0, color: 'text-cyan-400 border-cyan-500/20' },
              { label: 'Security', key: 'security', count: categoryCounts['security'] || 0, color: 'text-red-400 border-red-500/20' },
            ].map((cat) => (
              <div
                key={cat.key}
                className="bg-[#0c0f17] border border-[#1a202c] rounded-lg p-2 text-center"
              >
                <div className={`text-base font-mono font-bold ${cat.color}`}>{cat.count}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{cat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 bg-[#10141d] p-3 rounded-xl border border-[#1e2638]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Requirement ID (e.g. FR-001) or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredMatrix.length} Traceability Links
          </span>
        </div>

        {/* Traceability Matrix Table */}
        <div className="bg-[#10141d] border border-[#1e2638] rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead className="bg-[#0e121a] text-slate-300 font-semibold border-b border-[#1a202c]">
              <tr>
                <th className="p-3 w-32 font-semibold">Requirement ID</th>
                <th className="p-3 font-semibold">Requirement Description</th>
                <th className="p-3 w-64 font-semibold">Covering Test Cases</th>
                <th className="p-3 w-32 font-semibold">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171d2b]">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No requirement mappings found matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((item) => {
                  const reqObj = suite.requirementsList.find((r) => r.reqId === item.reqId);
                  const isCovered = item.mappedTestCaseIds.length > 0;

                  return (
                    <tr key={item.reqId} className="hover:bg-[#141824] transition">
                      <td className="p-3">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#161c2b] text-indigo-400 border border-[#242e44] inline-block">
                          {item.reqId}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200 text-xs mb-0.5">
                          {item.reqTitle}
                        </div>
                        {reqObj?.description && reqObj.description !== item.reqTitle && (
                          <div className="text-slate-400 text-[11px]">{reqObj.description}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.mappedTestCaseIds.length === 0 ? (
                            <span className="text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3 h-3" /> No test cases
                            </span>
                          ) : (
                            item.mappedTestCaseIds.map((tcId) => {
                              const matchingCase = suite.testCases.find((c) => c.id === tcId);
                              const isCasePassed = matchingCase?.status === 'passed';
                              const isCaseFailed = matchingCase?.status === 'failed';

                              return (
                                <button
                                  key={tcId}
                                  onClick={() => matchingCase && onSelectTestCase?.(matchingCase)}
                                  title={matchingCase?.scenario || tcId}
                                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold border transition flex items-center gap-1 ${
                                    isCasePassed
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/50'
                                      : isCaseFailed
                                      ? 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/50'
                                      : 'bg-[#181d2a] text-slate-300 border-slate-700 hover:bg-[#202738]'
                                  }`}
                                >
                                  <span>{tcId}</span>
                                  {isCasePassed && <span className="text-emerald-400">✓</span>}
                                  {isCaseFailed && <span className="text-rose-400">✗</span>}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {isCovered ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Covered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            Gap
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
