import React, { useState } from 'react';
import {
  HelpCircle,
  Copy,
  Check,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Server,
  Briefcase,
  Code2,
} from 'lucide-react';
import { TesterQuestion, TestSuite } from '../types';

interface TesterQuestionsCardProps {
  suite: TestSuite;
  onUpdateQuestion: (questions: TesterQuestion[]) => void;
  onOpenRequirementsModal: () => void;
}

export const TesterQuestionsCard: React.FC<TesterQuestionsCardProps> = ({
  suite,
  onUpdateQuestion,
  onOpenRequirementsModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [tempAnswer, setTempAnswer] = useState('');

  const questions: TesterQuestion[] = suite.testerQuestions || [
    {
      id: 'TQ-01',
      question: 'What is the retry backoff strategy if the downstream dependency returns 503 Service Unavailable?',
      rationale: 'Ensures the application does not cascade fail under downstream load spikes.',
      targetRole: 'Developer',
      status: 'open',
    },
    {
      id: 'TQ-02',
      question: 'Are there any database migration downtime requirements or backward compatibility constraints?',
      rationale: 'Zero-downtime deployment verification to prevent breaking active user sessions.',
      targetRole: 'DevOps',
      status: 'open',
    },
    {
      id: 'TQ-03',
      question: 'How should edge cases where input values are null or undefined be displayed to the end-user?',
      rationale: 'Prevents empty states or cryptic error messages from reaching customers.',
      targetRole: 'Product Owner',
      status: 'open',
    },
    {
      id: 'TQ-04',
      question: 'Does this endpoint enforce strict rate-limiting and authorization checks per user role?',
      rationale: 'Security requirement to mitigate credential stuffing and unauthorized data access.',
      targetRole: 'Security',
      status: 'open',
    },
  ];

  const handleStatusChange = (id: string, newStatus: 'open' | 'answered' | 'verified') => {
    const updated = questions.map((q) => (q.id === id ? { ...q, status: newStatus } : q));
    onUpdateQuestion(updated);
  };

  const handleSaveAnswer = (id: string) => {
    const updated = questions.map((q) => (q.id === id ? { ...q, answer: tempAnswer, status: 'answered' as const } : q));
    onUpdateQuestion(updated);
    setEditingAnswerId(null);
    setTempAnswer('');
  };

  const handleAddQuestion = () => {
    const nextId = `TQ-${String(questions.length + 1).padStart(2, '0')}`;
    const newQ: TesterQuestion = {
      id: nextId,
      question: 'New technical inquiry for review before sign-off...',
      rationale: 'Clarify boundary or security behavior with engineering team.',
      targetRole: 'Developer',
      status: 'open',
    };
    onUpdateQuestion([...questions, newQ]);
  };

  const handleCopyMarkdown = () => {
    const text = `### 🙋‍♂️ QA Inquiries & Questions Before Sign-Off (${suite.name})
${questions
  .map(
    (q, idx) => `${idx + 1}. **[${q.targetRole}]** ${q.question}
   - *Rationale:* ${q.rationale}
   - *Status:* ${q.status?.toUpperCase() || 'OPEN'}${q.answer ? `\n   - *Response:* ${q.answer}` : ''}`
  )
  .join('\n\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Developer':
        return <Code2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Product Owner':
        return <Briefcase className="w-3.5 h-3.5 text-amber-400" />;
      case 'DevOps':
        return <Server className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Security':
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Developer':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Product Owner':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DevOps':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Security':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner / Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1b2233]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Section 3 of 4
              </span>
              <span className="text-xs text-slate-400">
                {questions.filter((q) => q.status === 'verified').length}/{questions.length} Resolved
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Questions that Need to be Asked as a Tester
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddQuestion}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1a2133] border border-[#202838] text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Question</span>
          </button>
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1a2133] border border-[#202838] text-slate-200 transition"
            title="Copy formatted questions to paste into GitLab MR comments or standup updates"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? 'Copied Markdown' : 'Copy All for MR Discussion'}</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id || idx}
            className={`bg-[#10141d] border rounded-2xl p-5 shadow-lg transition space-y-3 ${
              q.status === 'verified'
                ? 'border-emerald-500/30 bg-emerald-950/10'
                : q.status === 'answered'
                ? 'border-indigo-500/30'
                : 'border-[#1e2638] hover:border-[#2b354d]'
            }`}
          >
            {/* Header: ID, Target Role, Status */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#161c28] text-indigo-300 border border-[#232c40]">
                  {q.id}
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getRoleBadge(
                    q.targetRole
                  )}`}
                >
                  {getRoleIcon(q.targetRole)}
                  <span>Ask {q.targetRole}</span>
                </span>
              </div>

              {/* Status Radio / Select */}
              <div className="flex items-center bg-[#141824] p-0.5 rounded-lg border border-[#1e2638] text-xs">
                <button
                  onClick={() => handleStatusChange(q.id, 'open')}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                    q.status === 'open' || !q.status
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Open</span>
                </button>
                <button
                  onClick={() => handleStatusChange(q.id, 'answered')}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                    q.status === 'answered'
                      ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Answered</span>
                </button>
                <button
                  onClick={() => handleStatusChange(q.id, 'verified')}
                  className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                    q.status === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>

            {/* Rationale / Context */}
            <div className="bg-[#141824] rounded-xl p-3 border border-[#1e2638] text-xs text-slate-300 leading-relaxed">
              <span className="text-amber-400/90 font-semibold mr-1.5">Why this matters:</span>
              <span>{q.rationale}</span>
            </div>

            {/* Developer/PO Answer Section */}
            {q.answer ? (
              <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3 text-xs text-emerald-200">
                <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recorded Response:
                  </span>
                  <button
                    onClick={() => {
                      setEditingAnswerId(q.id);
                      setTempAnswer(q.answer || '');
                    }}
                    className="text-slate-400 hover:text-white underline text-[10px]"
                  >
                    Edit
                  </button>
                </div>
                <p>{q.answer}</p>
              </div>
            ) : editingAnswerId === q.id ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={2}
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  placeholder="Record developer or PM's response here..."
                  className="w-full bg-[#141824] border border-[#1e2638] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingAnswerId(null)}
                    className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveAnswer(q.id)}
                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                  >
                    Save Response
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingAnswerId(q.id);
                  setTempAnswer('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Developer / PM Response</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
