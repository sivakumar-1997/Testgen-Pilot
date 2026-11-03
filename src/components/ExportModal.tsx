import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  HardDrive,
  Download,
  Copy,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Layers,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { TestSuite, CustomTemplate } from '../types';
import {
  exportToGoogleSheets,
  exportToGoogleDocs,
  exportToGoogleDrive,
  googleSignIn,
} from '../services/googleWorkspace';
import {
  generateTestCasesCsv,
  generateMatrixCsv,
  generateMarkdown,
  downloadFile,
} from '../services/exportUtils';

interface ExportModalProps {
  suite: TestSuite;
  template: CustomTemplate;
  user: User | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  suite,
  template,
  user,
  onClose,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Export to Google Sheets
  const handleExportSheets = async () => {
    try {
      setErrorMessage(null);
      setSuccessUrl(null);
      if (!user) {
        await googleSignIn();
      }
      setIsExporting(true);
      const res = await exportToGoogleSheets(
        suite.scenarioTitle || suite.name,
        suite.testCases,
        suite.traceabilityMatrix
      );
      setSuccessUrl(res.url);
      setSuccessMessage('Successfully created Google Sheet with Test Cases & Traceability Matrix!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sheets export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Google Docs
  const handleExportDocs = async () => {
    try {
      setErrorMessage(null);
      setSuccessUrl(null);
      if (!user) {
        await googleSignIn();
      }
      setIsExporting(true);
      const res = await exportToGoogleDocs(
        suite.scenarioTitle || suite.name,
        suite.requirementsRaw,
        suite.testCases,
        suite.traceabilityMatrix
      );
      setSuccessUrl(res.url);
      setSuccessMessage('Successfully generated Google Doc test specification report!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Docs export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Google Drive
  const handleExportDrive = async () => {
    try {
      setErrorMessage(null);
      setSuccessUrl(null);
      if (!user) {
        await googleSignIn();
      }
      setIsExporting(true);
      const csvContent = generateTestCasesCsv(suite.testCases, template);
      const fileName = `${suite.name.replace(/[^a-zA-Z0-9]/g, '_')}_TestCases.csv`;
      const res = await exportToGoogleDrive(fileName, csvContent, 'text/csv');
      setSuccessUrl(res.url);
      setSuccessMessage(`Saved "${fileName}" directly to your Google Drive!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Drive export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  // Local CSV Download (FR-012)
  const handleDownloadCsv = () => {
    const csvContent = generateTestCasesCsv(suite.testCases, template);
    const fileName = `${suite.name.replace(/[^a-zA-Z0-9]/g, '_')}_TestCases.csv`;
    downloadFile(csvContent, fileName, 'text/csv');
  };

  // Local RTCM Matrix CSV
  const handleDownloadMatrixCsv = () => {
    const matrixCsv = generateMatrixCsv(suite.traceabilityMatrix);
    const fileName = `${suite.name.replace(/[^a-zA-Z0-9]/g, '_')}_RTCM_Matrix.csv`;
    downloadFile(matrixCsv, fileName, 'text/csv');
  };

  // Local Markdown Download
  const handleDownloadMarkdown = () => {
    const md = generateMarkdown(suite.testCases, suite.scenarioTitle || suite.name, suite.traceabilityMatrix);
    const fileName = `${suite.name.replace(/[^a-zA-Z0-9]/g, '_')}_Spec.md`;
    downloadFile(md, fileName, 'text/markdown');
  };

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = async () => {
    const md = generateMarkdown(suite.testCases, suite.scenarioTitle || suite.name, suite.traceabilityMatrix);
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download JSON Backup
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(suite, null, 2);
    const fileName = `${suite.name.replace(/[^a-zA-Z0-9]/g, '_')}_suite.json`;
    downloadFile(jsonStr, fileName, 'application/json');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2233]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Test Suite & RTCM</h3>
              <p className="text-[11px] text-slate-400">
                Save to Google Workspace (Drive, Sheets, Docs) or download local formats.
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

        {/* Notifications */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            {successUrl && (
              <a
                href={successUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition shrink-0"
              >
                <span>Open File</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        <div className="mt-6 space-y-6 text-xs">
          {/* Section 1: Google Workspace Direct Export */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Google Workspace Cloud Integrations
              </h4>
              {user ? (
                <span className="text-[11px] text-emerald-400 font-medium">
                  Connected as {user.email}
                </span>
              ) : (
                <span className="text-[11px] text-amber-400">Sign-in required</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Google Sheets */}
              <button
                onClick={handleExportSheets}
                disabled={isExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition group text-center disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-xs">Google Sheets</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Full 2-tab spreadsheet with Test Cases & RTCM matrix
                </div>
              </button>

              {/* Google Docs */}
              <button
                onClick={handleExportDocs}
                disabled={isExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition group text-center disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-xs">Google Docs</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Executive test specification document
                </div>
              </button>

              {/* Google Drive */}
              <button
                onClick={handleExportDrive}
                disabled={isExporting}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition group text-center disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-105 transition">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="font-bold text-white text-xs">Google Drive</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Save raw CSV directly into user drive folder
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: Local Downloads */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Local Downloads & Files
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDownloadCsv}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <div className="text-left">
                    <div className="font-bold text-white">Download CSV (Test Cases)</div>
                    <div className="text-[10px] text-slate-400">
                      Formatted using active template: {template.name}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">.csv</span>
              </button>

              <button
                onClick={handleDownloadMatrixCsv}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  <div className="text-left">
                    <div className="font-bold text-white">Download RTCM Matrix CSV</div>
                    <div className="text-[10px] text-slate-400">
                      Requirements to Test Cases mappings
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">.csv</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <div className="text-left">
                    <div className="font-bold text-white">Download Markdown (.md)</div>
                    <div className="text-[10px] text-slate-400">
                      Ready for GitHub, GitLab, or Jira tickets
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">.md</span>
              </button>

              <button
                onClick={handleCopyMarkdown}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141824] hover:bg-[#1a2133] border border-[#1e2638] transition"
              >
                <div className="flex items-center gap-2.5">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  <div className="text-left">
                    <div className="font-bold text-white">
                      {copied ? 'Copied to Clipboard!' : 'Copy Markdown Table'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Paste directly into Slack, Jira, or Notion
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Clipboard</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-5 mt-6 border-t border-[#1b2233]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
