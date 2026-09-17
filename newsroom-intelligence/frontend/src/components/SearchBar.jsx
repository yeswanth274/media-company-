import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function SearchBar({
  onSearch,
  placeholder = "Ask your archive anything...",
  initialValue = "",
  loading = false,
  sampleQueries = [],
  className = "",
  variant = "dark"
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

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none flex items-center">
          <Search className="w-5 h-5 text-red-500" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={loading}
          className="w-full pl-12 pr-28 py-3.5 rounded-lg text-sm transition-all bg-zinc-900/90 border-2 border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:bg-zinc-950 disabled:cursor-not-allowed shadow-inner"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/60 active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Research</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
        </div>
      </form>

      {sampleQueries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-red-500" /> Suggested:
          </span>
          {sampleQueries.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer text-left font-normal text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 hover:border-red-600/50"
            >
              {sample}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
