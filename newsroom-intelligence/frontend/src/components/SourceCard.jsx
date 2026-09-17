import React from 'react';
import { FileText, Calendar, User, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function SourceCard({ chunk, onClick, onAddToStory, className = '' }) {
  if (!chunk) return null;

  return (
    <div
      onClick={() => onClick && onClick(chunk.chunk_id || chunk.id)}
      className={`bg-white rounded-lg border border-slate-200 p-4 hover:border-brand-500 hover:shadow-subtle transition-all cursor-pointer space-y-3 group ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {formatSourceType(chunk.source_type)}
            </span>
            {chunk.score !== undefined && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Relevance: {Math.round(chunk.score * 100)}%
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-800 transition-colors line-clamp-1 pt-1">
            {chunk.title}
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
          {formatDate(chunk.date)}
        </span>
      </div>

      {/* Excerpt */}
      <p className="text-xs font-serif leading-relaxed text-slate-700 line-clamp-3 bg-slate-50/70 p-2.5 rounded border border-slate-100">
        "{chunk.text || chunk.excerpt}"
      </p>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-3">
          {chunk.publication && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {chunk.publication}
            </span>
          )}
          {chunk.author && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {chunk.author}
            </span>
          )}
          {chunk.page_number && (
            <span className="font-mono text-slate-400">
              p. {chunk.page_number}
            </span>
          )}
          {chunk.timestamp_start && (
            <span className="flex items-center gap-1 font-mono text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" /> {chunk.timestamp_start}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onAddToStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToStory(chunk);
              }}
              className="text-xs font-medium text-slate-600 hover:text-brand-800 px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50"
            >
              + Add to Story
            </button>
          )}
          <span className="text-xs font-medium text-brand-800 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Inspect <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
