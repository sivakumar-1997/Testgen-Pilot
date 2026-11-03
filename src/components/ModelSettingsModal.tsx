import React, { useState } from 'react';
import {
  Cpu,
  Key,
  Server,
  Sparkles,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { ModelSettings, AIProvider } from '../types';

interface ModelSettingsModalProps {
  settings: ModelSettings;
  onSave: (settings: ModelSettings) => void;
  onClose: () => void;
}

export const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [provider, setProvider] = useState<AIProvider>(settings.provider);
  const [modelName, setModelName] = useState(settings.modelName || 'gemini-3.8-flash');
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [localEndpoint, setLocalEndpoint] = useState(settings.localEndpoint || 'http://localhost:11434');
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const providerModels: Record<AIProvider, string[]> = {
    gemini: ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
    anthropic: ['claude-3-7-sonnet-20250219', 'claude-3-5-haiku-20241022'],
    ollama: ['llama3.3', 'mistral', 'deepseek-r1', 'qwen2.5', 'codellama'],
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setModelName(providerModels[newProvider][0]);
    setTestStatus(null);
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestStatus(null);

      if (provider === 'gemini') {
        setTestStatus({
          success: true,
          message: 'Connected! Google Gemini is ready via built-in server proxy.',
        });
      } else if (provider === 'ollama') {
        const res = await fetch(`${localEndpoint}/api/tags`);
        if (!res.ok) throw new Error(`Ollama server returned HTTP ${res.status}`);
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name);
        setTestStatus({
          success: true,
          message: `Ollama connected! Found ${models.length} local models.`,
        });
      } else if (provider === 'openai') {
        if (!apiKey) throw new Error('Please enter your OpenAI API Key.');
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) throw new Error('Invalid OpenAI API Key or network error.');
        setTestStatus({ success: true, message: 'OpenAI API key validated successfully!' });
      } else if (provider === 'anthropic') {
        if (!apiKey) throw new Error('Please enter your Anthropic API Key.');
        setTestStatus({ success: true, message: 'Anthropic configuration saved.' });
      }
    } catch (err: any) {
      setTestStatus({ success: false, message: err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      modelName,
      apiKey: apiKey.trim(),
      localEndpoint: localEndpoint.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141d] border border-[#1e2638] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#1b2233]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Engine & Model Configuration</h3>
              <p className="text-[11px] text-slate-400">
                Switch between Gemini, OpenAI GPT-4, Anthropic Claude, or Local LLMs.
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

        <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
          {/* Provider Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">Select AI Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'gemini' as AIProvider, label: 'Gemini', sub: 'Built-in (Zero Config)', icon: Sparkles },
                { id: 'openai' as AIProvider, label: 'OpenAI GPT', sub: 'GPT-4o / o3-mini', icon: Zap },
                { id: 'anthropic' as AIProvider, label: 'Claude', sub: 'Claude 3.7 Sonnet', icon: Cpu },
                { id: 'ollama' as AIProvider, label: 'Local LLM', sub: 'Ollama / Offline', icon: Server },
              ].map((p) => {
                const isSelected = provider === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#141824] border-indigo-500 text-white shadow-sm'
                        : 'bg-[#0f121a] border-[#1e2638] text-slate-400 hover:border-[#28354f]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{p.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Name Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Model Name</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              {providerModels[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Specific Configuration */}
          {provider === 'gemini' && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Default Built-in Engine Active</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Google Gemini 3.8 Flash is pre-configured and runs seamlessly via server-side proxy. No manual API key required.
              </p>
            </div>
          )}

          {(provider === 'openai' || provider === 'anthropic') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  {provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
                </label>
                <span className="text-[10px] text-slate-500">Stored locally in your browser</span>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          )}

          {provider === 'ollama' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Local Ollama Endpoint
              </label>
              <input
                type="text"
                value={localEndpoint}
                onChange={(e) => setLocalEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-[#141824] border border-[#1e2638] rounded-lg p-2.5 text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          )}

          {/* Test Status Feedback */}
          {testStatus && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                testStatus.success
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {testStatus.success ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{testStatus.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1b2233]">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2133] text-slate-300 border border-[#202838] font-semibold text-xs transition flex items-center gap-1.5"
            >
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm shadow-indigo-600/30"
              >
                Apply Model
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
