import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { HelpCircle, Sparkles, Filter, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import AnswerCard from '../components/AnswerCard';
import LoadingState from '../components/LoadingState';
import api from '../services/api';

const DEMO_QUESTIONS = [
  "What happened during the 2018 Northstar investigation?",
  "What did Alex Morgan say about the investigation?",
  "Which sources disagree about when the investigation began?",
  "Build a timeline of the Northstar investigation.",
  "What evidence do we have about the 2021 settlement?",
  "Who are the key people mentioned in the archive?",
  "Show me previous coverage of Northstar Technologies.",
  "Give me a background briefing for a developing story about Northstar.",
];

export default function AskArchive() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [question, setQuestion] = useState(queryParam);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceTypeFilter, setSourceTypeFilter] = useState('');

  const { onSelectCitation } = useOutletContext() || {};

  const executeAsk = async (queryText, filters = {}) => {
    if (!queryText || !queryText.trim()) return;
    setLoading(true);
    setError(null);
    setQuestion(queryText);
    setSearchParams({ q: queryText });

    try {
      const res = await api.askArchive({
        question: queryText.trim(),
        top_k: 10,
        filters: {
          source_type: filters.source_type || sourceTypeFilter || undefined
        }
      });
      setResponse(res);
    } catch (err) {
      setError(err.message || 'Failed to retrieve archive evidence.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      executeAsk(queryParam);
    }
  }, [queryParam]);

  return (
    <div className="space-y-6 pb-12">
      <Header
        title="Ask the Archive"
        subtitle="Natural-language investigative query assistant backed strictly by indexed evidence."
      />

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Main Search/Question Box */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-brand-800" />
              Journalistic Research Inquiry
            </label>

            {/* Quick Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sourceTypeFilter}
                onChange={(e) => {
                  setSourceTypeFilter(e.target.value);
                  if (question) executeAsk(question, { source_type: e.target.value });
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:border-brand-800"
              >
                <option value="">All Source Types</option>
                <option value="article">Articles Only</option>
                <option value="interview">Interviews Only</option>
                <option value="transcript">Transcripts Only</option>
                <option value="footage_note">Footage Notes Only</option>
              </select>
            </div>
          </div>

          <SearchBar
            onSearch={(q) => executeAsk(q)}
            placeholder="Ask a factual question about people, events, dates, or investigations..."
            initialValue={question}
            loading={loading}
            sampleQueries={DEMO_QUESTIONS}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState message={`Analyzing archive evidence for: "${question}"`} />
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Research Retrieval Failed</p>
              <p className="text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Result Answer Card */}
        {response && !loading && (
          <AnswerCard
            response={response}
            onSelectCitation={onSelectCitation}
          />
        )}
      </div>
    </div>
  );
}
