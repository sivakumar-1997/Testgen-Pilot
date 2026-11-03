import React, { useState } from 'react';
import {
  Check,
  X,
  Clock,
  Ban,
  Plus,
  Filter,
  Search,
  Sparkles,
  Edit3,
  Trash2,
  Copy,
  ChevronDown,
  Layers,
  AlertCircle,
  Tag,
  ArrowUpDown,
  MoreVertical,
} from 'lucide-react';
import {
  TestCase,
  TestCaseStatus,
  CustomTemplate,
  TestSuite,
  TestCaseCategory,
  TestCasePriority,
} from '../types';

interface TestCaseTableProps {
  suite: TestSuite;
  template: CustomTemplate;
  onUpdateTestCase: (updatedCase: TestCase) => void;
  onAddTestCase: () => void;
  onDeleteTestCase: (id: string) => void;
  onDuplicateTestCase: (tc: TestCase) => void;
  onOpenRequirementsModal: () => void;
  onOpenTemplateModal: () => void;
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
  suite,
  template,
  onUpdateTestCase,
  onAddTestCase,
  onDeleteTestCase,
  onDuplicateTestCase,
  onOpenRequirementsModal,
  onOpenTemplateModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailModalCase, setDetailModalCase] = useState<TestCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Toggle status cycle: passed -> failed -> pending -> blocked -> passed
  const handleToggleStatus = (tc: TestCase) => {
    const cycle: Record<TestCaseStatus, TestCaseStatus> = {
      passed: 'failed',
      failed: 'pending',
      pending: 'blocked',
      blocked: 'passed',
      skipped: 'passed',
    };
    const nextStatus = cycle[tc.status] || 'passed';
    onUpdateTestCase({ ...tc, status: nextStatus });
  };

  const filteredCases = suite.testCases.filter((tc) => {
    if (categoryFilter !== 'all' && tc.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && tc.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tc.scenario.toLowerCase().includes(q) ||
        (tc.scope && tc.scope.toLowerCase().includes(q)) ||
        (tc.preconditions && tc.preconditions.toLowerCase().includes(q)) ||
        (tc.expectation && tc.expectation.toLowerCase().includes(q)) ||
        (tc.expectedResult && tc.expectedResult.toLowerCase().includes(q)) ||
        tc.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const passedCount = suite.testCases.filter((c) => c.status === 'passed').length;
  const failedCount = suite.testCases.filter((c) => c.status === 'failed').length;
  const pendingCount = suite.testCases.filter((c) => c.status === 'pending').length;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] overflow-hidden bg-[#0b0e14] text-slate-200">
      {/* Top Banner & Scenario Title */}
      <div className="p-3.5 sm:p-4 border-b border-[#1a202c] bg-[#0e121a] flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {suite.module}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">ID: {suite.id}</span>
            {suite.history && suite.history.length > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                v{suite.version} Memory
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate max-w-xl">
            {suite.scenarioTitle || suite.name}
          </h1>
        </div>

        {/* Action Controls & Metrics */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Metrics */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141824] border border-[#1e2638] text-xs">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {passedCount}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> {failedCount}
            </span>
            {pendingCount > 0 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {pendingCount}
                </span>
              </>
            )}
          </div>

          {/* Template Switcher button */}
          <button
            onClick={onOpenTemplateModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
            title="Switch column template"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">{template.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {/* Add Test Case Button */}
          <button
            onClick={onAddTestCase}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-[#141824] hover:bg-[#1a2133] border border-[#202838] transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Add Row</span>
          </button>

          {/* AI Adjust Button */}
          <button
            onClick={onOpenRequirementsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Brain Adjust</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-3 sm:px-4 py-2 border-b border-[#1a202c] bg-[#0c0f17] flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scope, steps, or expectation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121622] border border-[#1e2638] rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1 text-slate-400">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#121622] border border-[#1e2638] rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="boundary">Boundary</option>
              <option value="corner">Corner</option>
              <option value="edge">Edge Case</option>
              <option value="accessibility">Accessibility</option>
              <option value="security">Security</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-slate-400">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#121622] border border-[#1e2638] rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <span className="text-slate-500 text-[11px]">
            {filteredCases.length} of {suite.testCases.length}
          </span>
        </div>
      </div>

      {/* Main Table View with responsive horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[720px] text-left text-xs border-collapse">
          {/* Header Row */}
          <thead className="bg-[#0e121a] text-slate-400 font-semibold sticky top-0 z-10 border-b border-[#1a202c]">
            <tr>
              {template.columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 font-semibold tracking-wider text-slate-300 ${col.width || ''}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="p-3 w-16 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#171d2b]">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={template.columns.length + 1} className="p-8 text-center text-slate-500">
                  <AlertCircle className="w-7 h-7 text-slate-600 mx-auto mb-2" />
                  No test cases found matching current filters.
                </td>
              </tr>
            ) : (
              filteredCases.map((tc) => {
                const isFailed = tc.status === 'failed';
                const isPassed = tc.status === 'passed';
                const isPending = tc.status === 'pending';
                const isBlocked = tc.status === 'blocked';

                return (
                  <tr
                    key={tc.id}
                    className={`transition group hover:bg-[#121622] ${
                      isFailed ? 'bg-rose-950/10' : isPassed ? 'hover:bg-[#111520]' : ''
                    }`}
                  >
                    {template.columns.map((col) => {
                      // Order Column
                      if (col.key === 'order') {
                        return (
                          <td key={col.key} className="p-3 font-mono text-slate-500 font-semibold text-center w-10">
                            {tc.order}
                          </td>
                        );
                      }

                      // Test ID Badge
                      if (col.key === 'id') {
                        return (
                          <td key={col.key} className="p-3">
                            <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#161c2b] text-indigo-400 border border-[#242e44]">
                              {tc.id}
                            </span>
                          </td>
                        );
                      }

                      // Category Badge
                      if (col.key === 'category') {
                        const catColors: Record<string, string> = {
                          positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                          boundary: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                          corner: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                          accessibility: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                          edge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          security: 'bg-red-500/10 text-red-400 border-red-500/20',
                        };
                        return (
                          <td key={col.key} className="p-3">
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                                catColors[tc.category] || 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {tc.category}
                            </span>
                          </td>
                        );
                      }

                      // Priority Badge
                      if (col.key === 'priority') {
                        const prioColors: Record<string, string> = {
                          critical: 'text-rose-400 bg-rose-950/30 border-rose-800/40',
                          high: 'text-amber-400 bg-amber-950/30 border-amber-800/40',
                          medium: 'text-yellow-400 bg-yellow-950/30 border-yellow-800/40',
                          low: 'text-slate-400 bg-slate-800/40 border-slate-700/40',
                        };
                        return (
                          <td key={col.key} className="p-3">
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                prioColors[tc.priority] || 'text-slate-400'
                              }`}
                            >
                              {tc.priority}
                            </span>
                          </td>
                        );
                      }

                      // Test Steps Column
                      if (col.key === 'steps') {
                        return (
                          <td key={col.key} className="p-3 text-slate-300 max-w-xs">
                            <ol className="list-decimal list-inside space-y-0.5">
                              {tc.steps.map((st, i) => (
                                <li key={i} className="leading-snug">
                                  {st}
                                </li>
                              ))}
                            </ol>
                          </td>
                        );
                      }

                      // Pass/Fail / Status Pill (Subtle & clean)
                      if (col.key === 'status') {
                        return (
                          <td key={col.key} className="p-3">
                            <button
                              onClick={() => handleToggleStatus(tc)}
                              title="Click to toggle status (Passed / Failed / Pending)"
                              className={`flex items-center gap-1.5 px-2.5 py-0.8 rounded-full text-xs font-semibold transition shadow-sm select-none ${
                                isPassed
                                  ? 'bg-[#0f291e] text-emerald-400 border border-emerald-700/50 hover:bg-[#143527]'
                                  : isFailed
                                  ? 'bg-[#2d1217] text-rose-400 border border-rose-700/50 hover:bg-[#3b171f]'
                                  : isPending
                                  ? 'bg-[#291e0f] text-amber-400 border border-amber-700/50 hover:bg-[#362713]'
                                  : 'bg-[#181d2a] text-slate-400 border border-slate-700 hover:bg-[#202738]'
                              }`}
                            >
                              {isPassed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              {isFailed && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                              {isPending && <Clock className="w-3.5 h-3.5" />}
                              {isBlocked && <Ban className="w-3.5 h-3.5" />}
                              <span className="capitalize">{tc.status}</span>
                            </button>
                          </td>
                        );
                      }

                      // Scope / Action
                      if (col.key === 'scope') {
                        return (
                          <td key={col.key} className="p-3 font-medium text-slate-200 leading-snug">
                            {tc.scope || tc.scenario}
                            {tc.diffType && tc.diffType !== 'unchanged' && (
                              <span
                                className={`ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                  tc.diffType === 'new'
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                                    : tc.diffType === 'modified'
                                    ? 'bg-amber-950/60 text-amber-300 border border-amber-700/50'
                                    : 'bg-rose-950/60 text-rose-300 line-through'
                                }`}
                              >
                                {tc.diffType}
                              </span>
                            )}
                          </td>
                        );
                      }

                      // Preconditions
                      if (col.key === 'preconditions') {
                        return (
                          <td key={col.key} className="p-3 text-slate-400 leading-snug">
                            {tc.preconditions || '—'}
                          </td>
                        );
                      }

                      // Expectation
                      if (col.key === 'expectation') {
                        return (
                          <td key={col.key} className="p-3 text-slate-300 leading-snug">
                            {tc.expectation || tc.expectedResult}
                          </td>
                        );
                      }

                      // Expected Result
                      if (col.key === 'expectedResult') {
                        return (
                          <td key={col.key} className="p-3 text-slate-300 leading-snug">
                            {tc.expectedResult}
                          </td>
                        );
                      }

                      // Test Data
                      if (col.key === 'testData') {
                        return (
                          <td key={col.key} className="p-3 font-mono text-[11px] text-slate-400">
                            {tc.testData || '—'}
                          </td>
                        );
                      }

                      // Default custom field
                      const customVal = tc.customFields?.[col.key] || (tc as any)[col.key] || '—';
                      return (
                        <td key={col.key} className="p-3 text-slate-300">
                          {String(customVal)}
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setDetailModalCase(tc)}
                          title="Edit Details"
                          className="p-1 rounded hover:bg-[#1e2638] text-slate-400 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateTestCase(tc)}
                          title="Duplicate"
                          className="p-1 rounded hover:bg-[#1e2638] text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete test case ${tc.id}?`)) {
                              onDeleteTestCase(tc.id);
                            }
                          }}
                          title="Delete"
                          className="p-1 rounded hover:bg-[#1e2638] text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Detail Modal */}
      {detailModalCase && (
        <EditTestCaseModal
          testCase={detailModalCase}
          onSave={(updated) => {
            onUpdateTestCase(updated);
            setDetailModalCase(null);
          }}
          onClose={() => setDetailModalCase(null)}
        />
      )}
    </div>
  );
};

interface EditModalProps {
  testCase: TestCase;
  onSave: (updated: TestCase) => void;
  onClose: () => void;
}

const EditTestCaseModal: React.FC<EditModalProps> = ({ testCase, onSave, onClose }) => {
  const [formData, setFormData] = useState<TestCase>({ ...testCase });
  const [stepsText, setStepsText] = useState(testCase.steps.join('\n'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSteps = stepsText
      .split('\n')
      .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(Boolean);

    onSave({
      ...formData,
      steps: parsedSteps.length > 0 ? parsedSteps : ['Execute test scenario'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2233]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {formData.id}
            </span>
            <h3 className="text-base font-bold text-white">Edit Test Case</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2133]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Scenario Title / Name</label>
            <input
              type="text"
              value={formData.scenario}
              onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Scope (Short Action statement)</label>
            <input
              type="text"
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TestCaseCategory })}
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="boundary">Boundary</option>
                <option value="corner">Corner</option>
                <option value="edge">Edge Case</option>
                <option value="accessibility">Accessibility</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TestCasePriority })}
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Execution Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TestCaseStatus })}
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="blocked">Blocked</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Preconditions</label>
            <input
              type="text"
              value={formData.preconditions}
              onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">
              Test Steps (One step per line)
            </label>
            <textarea
              rows={4}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Test Data</label>
              <input
                type="text"
                value={formData.testData}
                onChange={(e) => setFormData({ ...formData, testData: e.target.value })}
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Concise Expectation</label>
              <input
                type="text"
                value={formData.expectation}
                onChange={(e) => setFormData({ ...formData, expectation: e.target.value })}
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Expected Result (Detailed)</label>
            <textarea
              rows={2}
              value={formData.expectedResult}
              onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Notes / Failure Log</label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Current build displays generic error instead of size limit"
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1b2233]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
