import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function SearchBar({
  onSearch,
  placeholder = "Ask your archive anything...",
  initialValue = "",
  loading = false,
  sampleQueries = [],
  className = "",
  variant = "light"
}) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  const handleSelectSample = (sample) => {
    setQuery(sample);
    onSearch(sample);
  };

  const isDark = variant === 'dark';

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none flex items-center">
          <Search className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-brand-800'}`} />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className={`w-full pl-12 pr-28 py-3.5 rounded-lg text-sm transition-all shadow-subtle disabled:cursor-not-allowed ${
            isDark
              ? 'bg-slate-950/80 border-2 border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-900'
              : 'bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-800 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50'
          }`}
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs ${
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30'
                : 'bg-brand-800 text-white hover:bg-brand-700'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Research</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
              </>
            )}
          </button>
        </div>
      </form>

      {sampleQueries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-brand-800'}`} /> Suggested:
          </span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer text-left font-normal ${
                isDark
                  ? 'text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700/80 hover:border-blue-500/50'
                  : 'text-slate-600 bg-white hover:bg-brand-50 hover:text-brand-800 hover:border-brand-300 border border-slate-200'
              }`}
            >
              {sample}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
