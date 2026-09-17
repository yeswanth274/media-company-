import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  FileText,
  Layers,
  Database,
  Briefcase,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  User,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import Header from '../components/Header';
import api from '../services/api';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { onSelectCitation } = useOutletContext() || {};

  useEffect(() => {
    api.getStatistics()
      .then((data) => setStats(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAsk = (query) => {
    navigate(`/ask?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="space-y-6 pb-12 bg-zinc-950 text-zinc-100 min-h-full">
      <Header
        title="Editorial Research Desk"
        subtitle="AI-powered archival research with evidence-backed answers."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Hero / Quick Research Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-xl border border-red-950/70 p-8 shadow-2xl space-y-6 text-white">
          {/* Subtle Ambient Red Glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-12 w-96 h-40 bg-red-800/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-semibold border border-red-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Evidence-First Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
              Research your archive. Find the evidence.
            </h1>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Search historical articles, subpoenaed transcripts, and reporter field logs. Every claim is strictly validated against archival sources with exact citations.
            </p>
          </div>

          <div className="relative z-10">
            <SearchBar
              variant="dark"
              onSearch={handleAsk}
              placeholder="Ask your archive anything (e.g. 'What happened during the 2018 Northstar probe?')..."
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/90 p-5 rounded-lg border border-zinc-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Archived Documents</span>
              <FileText className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.documents_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-zinc-500">Articles, transcripts, logs</p>
          </div>

          <div className="bg-zinc-900/90 p-5 rounded-lg border border-zinc-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Indexed Chunks</span>
              <Layers className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.chunks_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-zinc-500">Semantic vector units in FAISS</p>
          </div>

          <div className="bg-zinc-900/90 p-5 rounded-lg border border-zinc-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Distinct Sources</span>
              <Database className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.sources_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-zinc-500">Publications & authorities</p>
          </div>

          <div className="bg-zinc-900/90 p-5 rounded-lg border border-zinc-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Developing Stories</span>
              <Briefcase className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {stats?.stories_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-zinc-500">Investigative dossiers</p>
          </div>
        </div>

        {/* Two-Column Grid: Recent Research & Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Queries / Research Sessions */}
          <div className="bg-zinc-900/90 rounded-lg border border-zinc-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Recent Archive Queries
                </h3>
              </div>
              <button
                onClick={() => navigate('/ask')}
                className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline flex items-center gap-0.5"
              >
                New Query <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats?.recent_queries && stats.recent_queries.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_queries.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => navigate(`/ask?q=${encodeURIComponent(q.question)}`)}
                    className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-red-600 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200 group-hover:text-red-400 transition-colors line-clamp-1">
                        {q.question}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {formatDate(q.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-serif text-zinc-400 line-clamp-2 leading-relaxed">
                      {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                No recent queries recorded yet. Use the search bar above to begin!
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="bg-zinc-900/90 rounded-lg border border-zinc-800 shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Recently Indexed Documents
                </h3>
              </div>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline flex items-center gap-0.5"
              >
                View All ({stats?.documents_count || 0}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats?.recent_documents && stats.recent_documents.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents?highlight=${doc.id}`)}
                    className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800 hover:border-red-600 transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-200 group-hover:text-red-400 transition-colors line-clamp-1">
                        {doc.title}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {formatSourceType(doc.source_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 pt-1">
                      <span>{doc.publication || 'Archival record'}</span>
                      <span>•</span>
                      <span>{formatDate(doc.publication_date)}</span>
                      <span>•</span>
                      <span className="font-mono">{doc.chunk_count || 1} chunks</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500">
                No documents found in archive.
              </div>
            )}
          </div>
        </div>

        {/* Quick Investigative Topics Section */}
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Curated Investigative Starters
            </h3>
            <span className="text-xs text-zinc-500">Click to run full evidence synthesis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleAsk("What did Alex Morgan say about the investigation?")}
              className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-red-600 text-left transition-all hover:shadow-lg hover:shadow-red-950/30 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <User className="w-3.5 h-3.5" /> Key Entity Testimony
              </div>
              <h4 className="text-xs font-semibold text-white">Alex Morgan's Public Statements</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Examine executive denials versus internal board minutes from 2016.
              </p>
            </button>

            <button
              onClick={() => handleAsk("Which sources disagree about when the investigation began?")}
              className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-red-600 text-left transition-all hover:shadow-lg hover:shadow-red-950/30 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Conflict Analysis
              </div>
              <h4 className="text-xs font-semibold text-white">Investigation Timeline Discrepancies</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Compare Metro Daily April 2018 reporting against Elena Rostova's January 2018 audit.
              </p>
            </button>

            <button
              onClick={() => navigate('/stories')}
              className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-red-600 text-left transition-all hover:shadow-lg hover:shadow-red-950/30 cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <Briefcase className="w-3.5 h-3.5 text-red-500" /> Developing Story Workspace
              </div>
              <h4 className="text-xs font-semibold text-white">Build Comprehensive Dossier</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Assemble multi-chapter editorial briefing with verified chronology and export to PDF.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
