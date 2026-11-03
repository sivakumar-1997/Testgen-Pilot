import React, { useState, useRef } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { CustomTemplate, ColumnDefinition } from '../types';
import { parseTemplateFile, ParsedTemplateResult } from '../services/templateParser';

interface CustomTemplateModalProps {
  templates: CustomTemplate[];
  activeTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  onSaveTemplates: (templates: CustomTemplate[]) => void;
  onClose: () => void;
}

export const CustomTemplateModal: React.FC<CustomTemplateModalProps> = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
  onSaveTemplates,
  onClose,
}) => {
  const [allTemplates, setAllTemplates] = useState<CustomTemplate[]>([...templates]);
  const [selectedId, setSelectedId] = useState<string>(activeTemplateId);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newColumns, setNewColumns] = useState<ColumnDefinition[]>([
    { key: 'order', label: '#', type: 'text' },
    { key: 'scope', label: 'Action / Scope', type: 'text' },
    { key: 'preconditions', label: 'Preconditions', type: 'text' },
    { key: 'expectation', label: 'Expectation', type: 'text' },
    { key: 'status', label: 'Status', type: 'status' },
  ]);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<ParsedTemplateResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleApply = (id: string) => {
    onSelectTemplate(id);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsing(true);
      setUploadError(null);
      setUploadedFile(file);
      const parsed = await parseTemplateFile(file);
      setUploadResult(parsed);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse spreadsheet.');
      setUploadResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSwitchSheetTab = async (sheetName: string) => {
    if (!uploadedFile) return;
    try {
      setIsParsing(true);
      const parsed = await parseTemplateFile(uploadedFile, sheetName);
      setUploadResult(parsed);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmUploadedTemplate = () => {
    if (!uploadResult) return;
    const newTmpl = uploadResult.template;
    const updated = [newTmpl, ...allTemplates];
    setAllTemplates(updated);
    onSaveTemplates(updated);
    setSelectedId(newTmpl.id);
    onSelectTemplate(newTmpl.id);
    setUploadResult(null);
    setUploadedFile(null);
    onClose();
  };

  const handleAddColumn = () => {
    const key = `col_${Date.now()}`;
    setNewColumns([...newColumns, { key, label: 'Custom Column', type: 'text' }]);
  };

  const handleRemoveColumn = (index: number) => {
    setNewColumns(newColumns.filter((_, i) => i !== index));
  };

  const handleSaveNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTmpl: CustomTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || 'Custom user-defined QA column format',
      isBuiltIn: false,
      columns: newColumns,
    };

    const updated = [...allTemplates, newTmpl];
    setAllTemplates(updated);
    onSaveTemplates(updated);
    setSelectedId(newTmpl.id);
    setIsCreatingNew(false);
    onSelectTemplate(newTmpl.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2233]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Test Case Templates & Custom Schemas</h3>
              <p className="text-[11px] text-slate-400">
                Upload your company's Excel / CSV template or choose a built-in format.
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

        {/* Upload Template Section (with multi-tab detection) */}
        <div className="mt-5 p-4 rounded-xl bg-[#141824] border border-[#1e2638]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Upload Spreadsheet Template (.xlsx, .xls, .csv)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically identifies the tab containing <strong>"usecases"</strong>, <strong>"test cases"</strong>, or <strong>"cases"</strong> and adapts columns.
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isParsing ? 'Inspecting Tabs...' : 'Upload Excel / CSV'}</span>
              </button>
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Result & Tab Selector */}
          {uploadResult && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#0d1017] border border-[#232b3d] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                    Auto-Matched Tab
                  </span>
                  <span className="font-bold text-white text-xs font-mono">
                    "{uploadResult.sheetName}"
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({uploadResult.columns.length} columns extracted)
                  </span>
                </div>

                {/* If multiple tabs, allow user to change */}
                {uploadResult.allSheetNames.length > 1 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>Select different tab:</span>
                    <select
                      value={uploadResult.sheetName}
                      onChange={(e) => handleSwitchSheetTab(e.target.value)}
                      className="bg-[#141824] border border-[#232b3d] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {uploadResult.allSheetNames.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Column list preview */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Extracted Columns:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {uploadResult.columns.map((c) => (
                    <span
                      key={c.key}
                      className="px-2 py-0.5 rounded bg-[#161c2b] border border-[#28334a] text-slate-200 font-mono text-[11px]"
                    >
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Confirm & Use Template */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1b2233]">
                <button
                  type="button"
                  onClick={() => setUploadResult(null)}
                  className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUploadedTemplate}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use This Uploaded Template</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Templates Grid */}
        <div className="mt-6 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-200">Available Templates</h4>
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2133] text-indigo-400 border border-[#222c42] font-semibold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingNew ? 'Cancel Builder' : 'Create Custom Columns'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allTemplates.map((t) => {
              const isSelected = t.id === selectedId;
              const isActive = t.id === activeTemplateId;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#141824] border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-[#0f121a] border-[#1e2638] hover:border-[#28354f]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-sm">{t.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                          Active Layout
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {t.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1b2233] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {t.columns.length} columns: {t.columns.slice(0, 4).map((c) => c.label).join(' • ')}
                      {t.columns.length > 4 ? '...' : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(t.id);
                      }}
                      className="px-3 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-[11px]"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Template Builder */}
          {isCreatingNew && (
            <form
              onSubmit={handleSaveNewTemplate}
              className="mt-6 p-4 rounded-xl bg-[#141824] border border-[#222c42] space-y-4"
            >
              <h4 className="font-bold text-white text-sm">Build Custom Column Template</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Template Name</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Mobile QA Template"
                    className="w-full bg-[#0d1017] border border-[#1e2638] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                  <input
                    type="text"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="e.g. Includes device OS and network conditions"
                    className="w-full bg-[#0d1017] border border-[#1e2638] rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-400 font-semibold">Table Columns</label>
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="text-indigo-400 text-xs font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Column
                  </button>
                </div>

                <div className="space-y-2">
                  {newColumns.map((col, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-[#0d1017] border border-[#1e2638]"
                    >
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => {
                          const updated = [...newColumns];
                          updated[index].label = e.target.value;
                          updated[index].key = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                          setNewColumns(updated);
                        }}
                        placeholder="Column Header"
                        className="flex-1 bg-[#141824] border border-[#222c42] rounded px-2.5 py-1 text-white text-xs"
                      />
                      <select
                        value={col.type}
                        onChange={(e) => {
                          const updated = [...newColumns];
                          updated[index].type = e.target.value as any;
                          setNewColumns(updated);
                        }}
                        className="bg-[#141824] border border-[#222c42] rounded px-2 py-1 text-white text-xs"
                      >
                        <option value="text">Text</option>
                        <option value="badge">Badge</option>
                        <option value="steps">Step List</option>
                        <option value="status">Pass/Fail Status</option>
                      </select>
                      {newColumns.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(index)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save & Apply Template
                </button>
              </div>
            </form>
          )}
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
