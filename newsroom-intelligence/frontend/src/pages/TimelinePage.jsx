import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Search, Sparkles, AlertCircle, Calendar } from 'lucide-react';
import Header from '../components/Header';
import Timeline from '../components/Timeline';
import LoadingState from '../components/LoadingState';
import api from '../services/api';

const TIMELINE_PRESETS = [
  "Build a complete chronological timeline of Northstar Technologies.",
  "Timeline of the 2018 municipal investigation and whistleblower disclosures.",
  "Regulatory enforcement and settlement timeline 2021.",
];

export default function TimelinePage() {
  const [query, setQuery] = useState("Timeline of Northstar Technologies from 2015 to 2025");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { onSelectCitation } = useOutletContext() || {};

  const handleGenerateTimeline = async (timelineQuery) => {
    const q = timelineQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setQuery(q);

    try {
      const res = await api.generateTimeline({
        question: q.trim(),
        top_k: 20
      });
      setEvents(res || []);
    } catch (err) {
      setError(err.message || 'Failed to construct chronological archive timeline.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateTimeline();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <Header
        title="Chronology & Timeline"
        subtitle="Extract and verify historical milestones and event sequences directly from archive evidence."
      />

      <div className="max-w-4xl mx-auto px-6 space-y-6">
        {/* Input Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-subtle space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateTimeline();
            }}
            className="space-y-3"
          >
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-800" />
              Timeline Topic or Inquiry
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Build a timeline of the 2018 municipal investigation..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-brand-800"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-brand-800 text-white text-xs font-semibold rounded hover:bg-brand-700 disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
              >
                {loading ? 'Assembling...' : 'Build Timeline'}
              </button>
            </div>
          </form>

          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Presets:</span>
            {TIMELINE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleGenerateTimeline(preset)}
                className="text-xs text-slate-600 bg-slate-50 hover:bg-brand-50 hover:text-brand-800 border border-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <LoadingState message="Extracting and chronologically sequencing verified archive events..." />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded text-rose-800 text-sm">
            {error}
          </div>
        )}

        {/* Timeline Visualization */}
        {!loading && events.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Archival Milestone Sequence ({events.length} Events)
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  All milestones are verified against indexed source excerpts
                </p>
              </div>
            </div>

            <Timeline events={events} onSelectCitation={onSelectCitation} />
          </div>
        )}
      </div>
    </div>
  );
}
