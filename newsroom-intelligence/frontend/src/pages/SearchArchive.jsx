import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, BookOpen, User, Sparkles, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import SourceCard from '../components/SourceCard';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

export default function SearchArchive() {
  const [query, setQuery] = useState('Northstar');
  const [sourceType, setSourceType] = useState('');
  const [publication, setPublication] = useState('');
  const [author, setAuthor] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { onSelectCitation } = useOutletContext() || {};
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.searchArchive({
        query: query.trim(),
        top_k: 20,
        source_type: sourceType || undefined,
        publication: publication || undefined,
        author: author || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setResults(res.results || []);
    } catch (err) {
      setError(err.message || 'Search execution failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const handleAddToStory = (chunk) => {
    navigate(`/stories?addChunk=${chunk.chunk_id}&title=${encodeURIComponent(chunk.title)}`);
  };

  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Search Archive"
        subtitle="Multi-facet semantic & keyword search across decades of archived coverage."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Search & Filter Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-subtle space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search archive by keyword, topic, or entity (e.g. 'Apex sensor drift' or 'Alex Morgan')..."
                className="w-full pl-11 pr-28 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-brand-800 focus:ring-1 focus:ring-brand-100"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-2 px-4 py-1.5 bg-brand-800 text-white text-xs font-semibold rounded-md hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Faceted Filters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">Source Type</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-brand-800"
                >
                  <option value="">All Types</option>
                  <option value="article">Article</option>
                  <option value="interview">Interview</option>
                  <option value="transcript">Transcript</option>
                  <option value="footage_note">Footage Note</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Publication</label>
                <input
                  type="text"
                  value={publication}
                  onChange={(e) => setPublication(e.target.value)}
                  placeholder="e.g. Metro Daily"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Author / Reporter</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-brand-800 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:border-brand-800 font-mono text-[11px]"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing <strong className="text-slate-800 font-mono">{results.length}</strong> relevant archive excerpts for "{query}"
          </span>
        </div>

        {/* Results Stream */}
        {loading ? (
          <div className="py-16 text-center space-y-3 bg-white rounded-lg border border-slate-200">
            <div className="w-6 h-6 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Retrieving matching archive records...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-sm">
            {error}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="No archive matches found"
            description="Try removing specific metadata filters or searching with alternative keywords."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((chunk) => (
              <SourceCard
                key={chunk.chunk_id}
                chunk={chunk}
                onClick={(cid) => onSelectCitation && onSelectCitation(cid)}
                onAddToStory={handleAddToStory}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
