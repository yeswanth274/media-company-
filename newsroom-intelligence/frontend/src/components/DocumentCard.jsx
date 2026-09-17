import React from 'react';
import { FileText, Calendar, User, BookOpen, Layers, Trash2, Eye } from 'lucide-react';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function DocumentCard({ doc, onView, onDelete }) {
  if (!doc) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-subtle transition-all flex flex-col justify-between space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
            {formatSourceType(doc.source_type)}
          </span>
          <span className="text-xs font-mono text-slate-400">
            {formatDate(doc.publication_date)}
          </span>
        </div>

        <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
          {doc.title}
        </h4>

        {doc.description && (
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {doc.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {doc.publication && (
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {doc.publication}
            </span>
          )}
          <span className="flex items-center gap-1 font-mono text-slate-500">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            {doc.chunk_count || 1} chunks
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onView && (
            <button
              onClick={() => onView(doc.id)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-brand-800 transition-colors cursor-pointer"
              title="View Document Chunks"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(doc.id)}
              className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
