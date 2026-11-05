import React, { useState, useRef } from 'react';
import {
  Upload,
  Brain,
  FileSpreadsheet,
  AlertCircle,
  X,
  Check,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { TestCase, TestSuite } from '../types';
import { parseExistingTestCases } from '../services/templateParser';

interface ImportTestCasesModalProps {
  onImportComplete: (newSuite: TestSuite) => void;
  onClose: () => void;
}

export const ImportTestCasesModal: React.FC<ImportTestCasesModalProps> = ({
  onImportComplete,
  onClose,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCases, setDetectedCases] = useState<TestCase[]>([]);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [suiteName, setSuiteName] = useState<string>('');
  const [moduleName, setModuleName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setIsParsing(true);

    try {
      const res = await parseExistingTestCases(selected);
      setDetectedCases(res.testCases);
      setAvailableSheets(res.allSheetNames);
      setSelectedSheet(res.sheetName);
      setModuleName(res.detectedModule || 'Imported Tests');
      setSuiteName(`${selected.name.replace(/\.[^/.]+$/, '')} Test Suite`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse test cases file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSheetChange = async (sheet: string) => {
    if (!file) return;
    setSelectedSheet(sheet);
    setIsParsing(true);
    setError(null);

    try {
      const res = await parseExistingTestCases(file, sheet);
      setDetectedCases(res.testCases);
    } catch (err: any) {
      setError(err.message || 'Failed to parse sheet tab.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveToBrain = () => {
    if (detectedCases.length === 0) {
      setError('No test cases detected to import.');
      return;
    }

    const suiteId = `suite-imported-${Date.now()}`;
    const newSuite: TestSuite = {
      id: suiteId,
      name: suiteName.trim() || 'Imported Test Suite',
      module: moduleName.trim() || 'External Imports',
      scenarioTitle: `Imported Suite from ${file?.name || 'File'}`,
      version: 1,
      requirementsRaw: `Imported from ${file?.name || 'external file'} (Tab: ${selectedSheet}). Grounded ${detectedCases.length} test cases into Memory Brain.`,
      requirementsList: [
        {
          reqId: 'FR-IMP-01',
          title: `Imported specifications from ${selectedSheet}`,
          description: `Historical test cases for domain: ${moduleName}`,
          priority: 'high',
        },
      ],
      testCases: detectedCases,
      traceabilityMatrix: [
        {
          reqId: 'FR-IMP-01',
          reqTitle: `Imported specifications from ${selectedSheet}`,
          mappedTestCaseIds: detectedCases.map((c) => c.id),
          coverageStatus: 'fully_covered',
        },
      ],
      suiteSummary: {
        totalCases: detectedCases.length,
        positiveCount: detectedCases.filter((c) => c.category === 'positive').length,
        negativeCount: detectedCases.filter((c) => c.category === 'negative').length,
        boundaryCount: detectedCases.filter((c) => c.category === 'boundary').length,
        edgeCount: detectedCases.filter((c) => c.category === 'edge').length,
        cornerCount: detectedCases.filter((c) => c.category === 'corner').length,
        accessibilityCount: detectedCases.filter((c) => c.category === 'accessibility').length,
        securityCount: detectedCases.filter((c) => c.category === 'security').length,
        coveragePercentage: 100,
      },
      templateId: 'screenshot-template',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
    };

    onImportComplete(newSuite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#1b2233] bg-[#0c0f17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Import Existing Test Cases into Memory Brain
              </h3>
              <p className="text-[11px] text-slate-400">
                Ground the AI Brain with past test suites from Excel (.xlsx/.xls), CSV, or JSON.
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
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Import Error</div>
                <div className="text-[11px] mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Upload Zone */}
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#232c40] hover:border-purple-500/60 rounded-2xl p-8 text-center cursor-pointer transition bg-[#141824]/50 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-3 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Drop your existing Test Case file here, or browse
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
                Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json). Multi-tab workbooks auto-detect tabs named{' '}
                <code className="text-purple-300">usecases</code>, <code className="text-purple-300">test cases</code>, or{' '}
                <code className="text-purple-300">cases</code>.
              </p>
              <span className="inline-block px-3 py-1.5 rounded-lg bg-[#1c2333] text-purple-300 text-xs font-semibold border border-purple-500/30">
                Choose File to Teach Memory Brain
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info & Sheet Selection */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#1e2638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">{file.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Detected {detectedCases.length} Test Cases
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setDetectedCases([]);
                  }}
                  className="text-xs text-slate-400 hover:text-white underline self-start sm:self-auto"
                >
                  Change File
                </button>
              </div>

              {/* Multi-Tab Selector */}
              {availableSheets.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Select Workbook Tab (Auto-detected best match):</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSheets.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSheetChange(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          selectedSheet === s
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-[#141824] text-slate-300 border-[#1e2638] hover:border-slate-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suite & Module Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Domain / Module Name
                  </label>
                  <input
                    type="text"
                    value={moduleName}
                    onChange={(e) => setModuleName(e.target.value)}
                    placeholder="e.g. Shipment, Checkout, Auth"
                    className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Suite Title
                  </label>
                  <input
                    type="text"
                    value={suiteName}
                    onChange={(e) => setSuiteName(e.target.value)}
                    placeholder="e.g. Carrier Webhook Tests"
                    className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Parsed Rows Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
                  <span>Detected Cases Preview (Showing first 4 of {detectedCases.length})</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready to ground
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detectedCases.slice(0, 4).map((tc, idx) => (
                    <div
                      key={tc.id || idx}
                      className="p-2.5 rounded-xl bg-[#141824] border border-[#1e2638] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {tc.id}
                          </span>
                          <span className="font-semibold text-white truncate">{tc.scenario}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {tc.expectedResult || tc.expectation}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                        {tc.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#1b2233] bg-[#0c0f17]">
          <div className="text-[11px] text-slate-400">
            {detectedCases.length > 0 && (
              <span>
                Will add <strong>{detectedCases.length} cases</strong> to Memory Brain knowledge
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveToBrain}
              disabled={detectedCases.length === 0 || isParsing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-sm shadow-purple-600/30 transition disabled:opacity-50"
            >
              <Brain className="w-4 h-4" />
              <span>Ground into Memory Brain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
