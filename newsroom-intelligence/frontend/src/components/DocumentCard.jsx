import React from 'react';
import { FileText, Calendar, User, BookOpen, Layers, Trash2, Eye } from 'lucide-react';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function DocumentCard({ doc, onView, onDelete }) {
  if (!doc) return null;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-red-600/60 hover:shadow-xl transition-all flex flex-col justify-between space-y-3 text-zinc-100">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-950 text-zinc-300 border border-zinc-800">
            {formatSourceType(doc.source_type)}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {formatDate(doc.publication_date, doc.created_at)}
          </span>
        </div>

        <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
          {doc.title}
        </h4>

        {doc.description && (
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-serif">
            {doc.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          {doc.publication && (
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              {doc.publication}
            </span>
          )}
          <span className="flex items-center gap-1 font-mono text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            {doc.chunk_count || 1} chunks
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onView && (
            <button
              onClick={() => onView(doc.id)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="View Document Chunks"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(doc.id)}
              className="p-1.5 rounded hover:bg-red-950/50 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
