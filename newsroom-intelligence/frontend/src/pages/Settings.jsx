import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Cpu, Key, Database, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Header from '../components/Header';
import api from '../services/api';

export default function Settings() {
  const [settingsData, setSettingsData] = useState(null);
  const [provider, setProvider] = useState('groq');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [groqKey, setGroqKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

  const [showKeys, setShowKeys] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        setSettingsData(data);
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.llm_model) setModel(data.llm_model);
        if (data.ollama_base_url) setOllamaUrl(data.ollama_base_url);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const payload = {
        llm_provider: provider,
        llm_model: model,
        groq_api_key: groqKey || undefined,
        openai_api_key: openaiKey || undefined,
        gemini_api_key: geminiKey || undefined,
        ollama_base_url: ollamaUrl || undefined,
      };
      const res = await api.updateSettings(payload);
      setNotification({ type: 'success', text: 'Settings successfully updated.' });
      setSettingsData((prev) => ({ ...prev, ...res }));
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <Header
        title="Settings & Model Configuration"
        subtitle="Manage LLM provider abstractions, embedding models, and vector index parameters."
      />

      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {notification && (
          <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span>{notification.text}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {/* LLM Provider Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-800" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                LLM Provider Abstraction
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Active: <strong className="text-brand-800 uppercase">{provider}</strong>
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Select Synthesis Engine
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'groq', label: 'Groq API', desc: 'Llama 3.3 70B' },
                  { id: 'openai', label: 'OpenAI API', desc: 'GPT-4o / Compatible' },
                  { id: 'gemini', label: 'Google Gemini', desc: 'Gemini 1.5 Flash' },
                  { id: 'ollama', label: 'Ollama (Local)', desc: 'Self-hosted LLM' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p.id);
                      if (p.id === 'groq') setModel('llama-3.3-70b-versatile');
                      if (p.id === 'openai') setModel('gpt-4o-mini');
                      if (p.id === 'gemini') setModel('gemini-1.5-flash');
                      if (p.id === 'ollama') setModel('llama3.2');
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      provider === p.id
                        ? 'border-brand-800 bg-brand-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{p.label}</div>
                    <div className="text-[11px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-brand-800"
                />
              </div>

              {provider === 'ollama' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ollama Base URL
                  </label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                </div>
              )}
            </div>

            {/* API Keys based on provider */}
            {provider !== 'ollama' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    {provider.toUpperCase()} API Key (Optional — deterministic evidence synthesis fallback active if empty)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showKeys ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                {provider === 'groq' && (
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                    placeholder={settingsData?.has_groq_key ? '•••••••••••••••• (Key Configured)' : 'Enter Groq API Key (gsk_...)'}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                )}

                {provider === 'openai' && (
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={settingsData?.has_openai_key ? '•••••••••••••••• (Key Configured)' : 'Enter OpenAI API Key (sk-...)'}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                )}

                {provider === 'gemini' && (
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={settingsData?.has_gemini_key ? '•••••••••••••••• (Key Configured)' : 'Enter Google Gemini API Key'}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-brand-800"
                  />
                )}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-brand-800 text-white text-xs font-semibold rounded-md hover:bg-brand-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Vector Store & Embedding Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Database className="w-4 h-4 text-brand-800" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Vector Store & Embeddings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">Embedding Model</span>
              <div className="font-mono font-bold text-slate-800">
                {settingsData?.embedding_model || 'sentence-transformers/all-MiniLM-L6-v2'}
              </div>
              <p className="text-[11px] text-slate-500">384-dimensional dense vectors with L2 normalization</p>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">FAISS Vector Index</span>
              <div className="font-mono font-bold text-slate-800">
                IndexFlatIP (Cosine Similarity)
              </div>
              <p className="text-[11px] text-slate-500">
                Total Vectors: <strong className="font-mono text-brand-800">{settingsData?.faiss_total_vectors ?? '--'}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
