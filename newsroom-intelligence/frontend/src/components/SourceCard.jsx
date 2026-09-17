import React from 'react';
import { FileText, Calendar, User, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function SourceCard({ chunk, onClick, onAddToStory, className = '' }) {
  if (!chunk) return null;

  return (
    <div
      onClick={() => onClick && onClick(chunk.chunk_id || chunk.id)}
      className={`bg-zinc-900/90 rounded-lg border border-zinc-800 p-4 hover:border-red-600 hover:shadow-lg hover:shadow-red-950/40 transition-all cursor-pointer space-y-3 group ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
              {formatSourceType(chunk.source_type)}
            </span>
            {chunk.score !== undefined && (
              <span className="text-[11px] font-mono text-red-400 bg-red-950/80 border border-red-900/60 px-1.5 py-0.5 rounded">
                Relevance: {Math.round(chunk.score * 100)}%
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1 pt-1">
            {chunk.title}
          </h4>
        </div>
        <span className="text-xs font-mono text-zinc-500 whitespace-nowrap">
          {formatDate(chunk.date)}
        </span>
      </div>

      {/* Excerpt */}
      <p className="text-xs font-serif leading-relaxed text-zinc-300 line-clamp-3 bg-zinc-950/80 p-2.5 rounded border border-zinc-850 border-zinc-800/80">
        "{chunk.text || chunk.excerpt}"
      </p>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800 gap-2">
        <div className="flex items-center gap-3">
          {chunk.publication && (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              {chunk.publication}
            </span>
          )}
          {chunk.author && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              {chunk.author}
            </span>
          )}
          {chunk.page_number && (
            <span className="font-mono text-zinc-500">
              p. {chunk.page_number}
            </span>
          )}
          {chunk.timestamp_start && (
            <span className="flex items-center gap-1 font-mono text-zinc-500">
              <Clock className="w-3 h-3 text-zinc-500" /> {chunk.timestamp_start}
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
              className="text-xs font-medium text-zinc-300 hover:text-white px-2 py-0.5 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-750"
            >
              + Add to Story
            </button>
          )}
          <span className="text-xs font-medium text-red-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Inspect <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
