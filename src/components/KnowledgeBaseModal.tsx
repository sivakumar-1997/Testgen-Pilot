import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { KnowledgeDocument } from '../types';

interface KnowledgeBaseModalProps {
  knowledgeBase: KnowledgeDocument[];
  onSaveKnowledgeBase: (docs: KnowledgeDocument[]) => void;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  knowledgeBase,
  onSaveKnowledgeBase,
  onClose,
}) => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([...knowledgeBase]);
  const [selectedDocId, setSelectedDocId] = useState<string>(docs[0]?.id || '');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<KnowledgeDocument['category']>('guideline');
  const [newDocContent, setNewDocContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  const handleToggleActive = (id: string) => {
    const updated = docs.map((d) => (d.id === id ? { ...d, isActive: !d.isActive } : d));
    setDocs(updated);
    onSaveKnowledgeBase(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this knowledge reference document?')) {
      const updated = docs.filter((d) => d.id !== id);
      setDocs(updated);
      onSaveKnowledgeBase(updated);
      if (selectedDocId === id) {
        setSelectedDocId(updated[0]?.id || '');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const newDoc: KnowledgeDocument = {
          id: `kb-${Date.now()}`,
          name: file.name,
          category: 'guideline',
          content,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const updated = [newDoc, ...docs];
        setDocs(updated);
        setSelectedDocId(newDoc.id);
        onSaveKnowledgeBase(updated);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveNewDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocContent.trim()) return;

    const newDoc: KnowledgeDocument = {
      id: `kb-${Date.now()}`,
      name: newDocName.trim(),
      category: newDocCategory,
      content: newDocContent.trim(),
      fileSize: `${(newDocContent.length / 1024).toFixed(1)} KB`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newDoc, ...docs];
    setDocs(updated);
    setSelectedDocId(newDoc.id);
    onSaveKnowledgeBase(updated);
    setIsAddingNew(false);
    setNewDocName('');
    setNewDocContent('');
  };

  const handleUpdateContent = (content: string) => {
    const updated = docs.map((d) => (d.id === selectedDocId ? { ...d, content } : d));
    setDocs(updated);
    onSaveKnowledgeBase(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-[#1b2233] bg-[#0c0f17] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Knowledge Base & Grounding Context
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Learn & Train AI
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Ground test generation on your organization’s QA guidelines, custom test formats, past bug patterns, and domain constraints.
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

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Document List */}
          <div className="w-72 sm:w-80 border-r border-[#1a202c] bg-[#0c0f17] p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">Reference Guidelines</span>
                <div className="flex items-center gap-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.md,.json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload File (.md, .txt)"
                    className="p-1 rounded bg-[#161c28] hover:bg-[#1f2638] text-slate-300 text-xs flex items-center gap-1 px-2 border border-[#232c40]"
                  >
                    <Upload className="w-3 h-3 text-indigo-400" />
                    <span>Upload</span>
                  </button>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    title="Create Reference Note"
                    className="p-1 rounded bg-[#161c28] hover:bg-[#1f2638] text-slate-300 text-xs flex items-center gap-1 px-2 border border-[#232c40]"
                  >
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>New</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
                {docs.map((d) => {
                  const isSelected = d.id === selectedDocId;
                  return (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDocId(d.id);
                        setIsAddingNew(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between group ${
                        isSelected
                          ? 'bg-[#151a26] border-indigo-500 text-white'
                          : 'bg-[#10141d] border-[#1e2638] text-slate-400 hover:border-[#28354f]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-200 truncate">{d.name}</div>
                        <div className="text-[10px] text-slate-500 capitalize flex items-center gap-2 mt-0.5">
                          <span>{d.category}</span>
                          <span>•</span>
                          <span>{d.fileSize || 'Text'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Toggle active switch */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(d.id);
                          }}
                          title={d.isActive ? 'Active (Included in AI prompt)' : 'Inactive'}
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border transition ${
                            d.isActive
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-500'
                          }`}
                        >
                          {d.isActive && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(d.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 p-2 border-t border-[#1a202c] bg-[#090c12] rounded-lg mt-2">
              Checked documents are automatically injected into generation prompts.
            </div>
          </div>

          {/* Right: Document Viewer / Editor */}
          <div className="flex-1 p-5 overflow-y-auto bg-[#10141d]">
            {isAddingNew ? (
              <form onSubmit={handleSaveNewDoc} className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#1b2233]">
                  <h4 className="font-bold text-white text-sm">Add New Knowledge Document</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Document Title</label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="e.g. Payment Gateway QA Standards"
                      className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Category</label>
                    <select
                      value={newDocCategory}
                      onChange={(e) => setNewDocCategory(e.target.value as any)}
                      className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="guideline">QA Guideline</option>
                      <option value="template">Test Template Spec</option>
                      <option value="glossary">Domain Glossary</option>
                      <option value="bug_pattern">Past Bug Trends</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Content (Markdown / Text)</label>
                  <textarea
                    rows={12}
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Enter style rules, boundary conventions, regulatory limits, or sample test case format..."
                    className="w-full bg-[#141824] border border-[#1e2638] rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                  >
                    Save Reference
                  </button>
                </div>
              </form>
            ) : selectedDoc ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1b2233]">
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedDoc.name}</h4>
                    <span className="text-[11px] text-slate-400 capitalize">
                      Category: {selectedDoc.category} | Status: {selectedDoc.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleActive(selectedDoc.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                      selectedDoc.isActive
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {selectedDoc.isActive ? '✓ Grounding Active' : 'Enable Grounding'}
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">
                    Editable Reference Specification
                  </label>
                  <textarea
                    rows={15}
                    value={selectedDoc.content}
                    onChange={(e) => handleUpdateContent(e.target.value)}
                    className="w-full bg-[#141824] border border-[#1e2638] rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select or upload a document to inspect its content.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[#1b2233] bg-[#0c0f17] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
