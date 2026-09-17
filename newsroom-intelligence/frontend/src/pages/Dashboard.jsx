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

const DEMO_QUESTIONS = [
  "What happened during the 2018 Northstar investigation?",
  "What did Alex Morgan say about the investigation?",
  "Which sources disagree about when the investigation began?",
  "Build a timeline of the Northstar investigation.",
  "What evidence do we have about the 2021 settlement?",
  "Show me previous coverage of Northstar Technologies.",
];

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
    <div className="space-y-6 pb-12">
      <Header
        title="Editorial Research Desk"
        subtitle="AI-powered archival research with evidence-backed answers."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* Hero / Quick Research Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-xl border border-slate-800 p-8 shadow-xl space-y-6 text-white">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-12 w-96 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold border border-blue-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Evidence-First Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
              Research your archive. Find the evidence.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Search historical articles, subpoenaed transcripts, and reporter field logs. Every claim is strictly validated against archival sources with exact citations.
            </p>
          </div>

          <div className="relative z-10">
            <SearchBar
              variant="dark"
              onSearch={handleAsk}
              placeholder="Ask your archive anything (e.g. 'What happened during the 2018 Northstar probe?')..."
              sampleQueries={DEMO_QUESTIONS.slice(0, 4)}
            />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Archived Documents</span>
              <FileText className="w-4 h-4 text-brand-800" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats?.documents_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-slate-500">Articles, transcripts, logs</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Indexed Chunks</span>
              <Layers className="w-4 h-4 text-brand-800" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats?.chunks_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-slate-500">Semantic vector units in FAISS</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Distinct Sources</span>
              <Database className="w-4 h-4 text-brand-800" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats?.sources_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-slate-500">Publications & authorities</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Developing Stories</span>
              <Briefcase className="w-4 h-4 text-brand-800" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {stats?.stories_count ?? (loading ? '...' : 0)}
            </div>
            <p className="text-[11px] text-slate-500">Investigative dossiers</p>
          </div>
        </div>

        {/* Two-Column Grid: Recent Research & Recent Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Queries / Research Sessions */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Recent Archive Queries
                </h3>
              </div>
              <button
                onClick={() => navigate('/ask')}
                className="text-xs font-medium text-brand-800 hover:underline flex items-center gap-0.5"
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
                    className="p-3.5 rounded-md bg-slate-50 border border-slate-200 hover:border-brand-400 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 group-hover:text-brand-800 transition-colors line-clamp-1">
                        {q.question}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDate(q.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-serif text-slate-600 line-clamp-2 leading-relaxed">
                      {q.answer}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No recent queries recorded yet. Use the search bar above to begin!
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-subtle p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-800" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Recently Indexed Documents
                </h3>
              </div>
              <button
                onClick={() => navigate('/documents')}
                className="text-xs font-medium text-brand-800 hover:underline flex items-center gap-0.5"
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
                    className="p-3.5 rounded-md bg-slate-50 border border-slate-200 hover:border-brand-400 transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 group-hover:text-brand-800 transition-colors line-clamp-1">
                        {doc.title}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {formatSourceType(doc.source_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
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
              <div className="py-8 text-center text-xs text-slate-500">
                No documents found in archive.
              </div>
            )}
          </div>
        </div>

        {/* Quick Investigative Topics Section */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Curated Investigative Starters
            </h3>
            <span className="text-xs text-slate-500">Click to run full evidence synthesis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleAsk("What did Alex Morgan say about the investigation?")}
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-brand-500 text-left transition-all hover:shadow-xs cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800">
                <User className="w-3.5 h-3.5" /> Key Entity Testimony
              </div>
              <h4 className="text-xs font-semibold text-slate-900">Alex Morgan's Public Statements</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Examine executive denials versus internal board minutes from 2016.
              </p>
            </button>

            <button
              onClick={() => handleAsk("Which sources disagree about when the investigation began?")}
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-brand-500 text-left transition-all hover:shadow-xs cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Conflict Analysis
              </div>
              <h4 className="text-xs font-semibold text-slate-900">Investigation Timeline Discrepancies</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Compare Metro Daily April 2018 reporting against Elena Rostova's January 2018 audit.
              </p>
            </button>

            <button
              onClick={() => navigate('/stories')}
              className="p-4 bg-white rounded-lg border border-slate-200 hover:border-brand-500 text-left transition-all hover:shadow-xs cursor-pointer space-y-1.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Briefcase className="w-3.5 h-3.5" /> Developing Story Workspace
              </div>
              <h4 className="text-xs font-semibold text-slate-900">Build Comprehensive Dossier</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Assemble multi-chapter editorial briefing with verified chronology and export to PDF.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
