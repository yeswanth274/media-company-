import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { HelpCircle, Filter, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import AnswerCard from '../components/AnswerCard';
import LoadingState from '../components/LoadingState';
import api from '../services/api';

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
    <div className="space-y-6 pb-12 bg-zinc-950 text-zinc-100 min-h-full">
      <Header
        title="Ask the Archive"
        subtitle="Natural-language investigative query assistant backed strictly by indexed evidence."
      />

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Main Search/Question Box */}
        <div className="bg-zinc-900/90 rounded-lg border border-zinc-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-red-500" />
              Journalistic Research Inquiry
            </label>

            {/* Quick Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={sourceTypeFilter}
                onChange={(e) => {
                  setSourceTypeFilter(e.target.value);
                  if (question) executeAsk(question, { source_type: e.target.value });
                }}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-red-600"
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
            variant="dark"
            onSearch={(q) => executeAsk(q)}
            placeholder="Ask a factual question about people, events, dates, or investigations..."
            initialValue={question}
            loading={loading}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState message={`Analyzing archive evidence for: "${question}"`} />
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-lg text-red-200 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-300">Research Retrieval Failed</p>
              <p className="text-xs leading-relaxed text-red-200">{error}</p>
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
