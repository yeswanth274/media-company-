import React, { useEffect, useState } from 'react';
import { X, FileText, Calendar, User, BookOpen, Clock, MapPin, ExternalLink, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatDate, formatSourceType } from '../utils/formatters';

export default function SourceDetailModal({ chunkId, citationId, onClose, onNavigateDocument }) {
  const [contextData, setContextData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!chunkId) return;
    setLoading(true);
    setError(null);
    api.getSource(chunkId)
      .then((data) => {
        setContextData(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch surrounding source context.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [chunkId]);

  if (!chunkId) return null;

  const currentChunk = contextData?.current_chunk;
  const prevChunk = contextData?.previous_chunk;
  const nextChunk = contextData?.next_chunk;
  const doc = contextData?.document;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {citationId && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-800 text-white">
                  [{citationId}]
                </span>
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {formatSourceType(currentChunk?.source_type || doc?.source_type)}
              </span>
              {currentChunk?.page_number && (
                <span className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Page {currentChunk.page_number}
                </span>
              )}
              {currentChunk?.timestamp_start && (
                <span className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {currentChunk.timestamp_start}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              {currentChunk?.document_title || doc?.title || 'Archival Source Detail'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block font-medium">PUBLICATION</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3 text-slate-400" />
              {currentChunk?.publication || doc?.publication || 'Archive Repository'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">AUTHOR / REPORTER</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-slate-400" />
              {currentChunk?.author || doc?.author || 'Uncredited'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">RECORD DATE</span>
            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formatDate(currentChunk?.publication_date || doc?.publication_date)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">ORIGINAL FILENAME</span>
            <span className="font-mono text-slate-700 truncate block mt-0.5" title={doc?.original_filename}>
              {doc?.original_filename || 'archived_record'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-mono">Retrieving surrounding archive context...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Surrounding Context: Previous Chunk */}
              {prevChunk && (
                <div className="space-y-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    PREVIOUS ARCHIVE SECTION (Chunk #{prevChunk.chunk_index + 1})
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-md border border-dashed border-slate-200 text-xs font-serif leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {prevChunk.text}
                  </div>
                </div>
              )}

              {/* Exact Evidence Chunk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800">
                    <ShieldCheck className="w-4 h-4 text-brand-800" />
                    EXACT ARCHIVAL EVIDENCE USED BY AI (Chunk #{currentChunk?.chunk_index + 1})
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Chunk ID: {currentChunk?.id}
                  </span>
                </div>
                <div className="p-4 bg-brand-50/50 rounded-md border-2 border-brand-200 text-sm font-serif leading-relaxed text-slate-900 shadow-xs whitespace-pre-wrap">
                  {currentChunk?.text}
                </div>
              </div>

              {/* Surrounding Context: Next Chunk */}
              {nextChunk && (
                <div className="space-y-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    NEXT ARCHIVE SECTION (Chunk #{nextChunk.chunk_index + 1})
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-md border border-dashed border-slate-200 text-xs font-serif leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {nextChunk.text}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-slate-700">Editorial Standard:</span> Full archival traceability verified.
          </div>
          <div className="flex items-center gap-2">
            {doc && onNavigateDocument && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateDocument(doc.id);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-medium transition-colors cursor-pointer"
              >
                View Full Document <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-slate-800 text-white hover:bg-slate-900 font-medium transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
