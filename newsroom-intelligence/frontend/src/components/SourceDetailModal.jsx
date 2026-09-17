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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-zinc-900 rounded-lg shadow-2xl border border-zinc-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-start justify-between bg-zinc-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {citationId && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white shadow-md shadow-red-950">
                  [{citationId}]
                </span>
              )}
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {formatSourceType(currentChunk?.source_type || doc?.source_type)}
              </span>
              {currentChunk?.page_number && (
                <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" /> Page {currentChunk.page_number}
                </span>
              )}
              {currentChunk?.timestamp_start && (
                <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" /> {currentChunk.timestamp_start}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white leading-snug">
              {currentChunk?.document_title || doc?.title || 'Archival Source Detail'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="px-6 py-3 bg-zinc-950/80 border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-zinc-400">
          <div>
            <span className="text-zinc-500 block font-medium">PUBLICATION</span>
            <span className="font-semibold text-zinc-200 flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3 h-3 text-zinc-500" />
              {currentChunk?.publication || doc?.publication || 'Archive Repository'}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">AUTHOR / REPORTER</span>
            <span className="font-semibold text-zinc-200 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-zinc-500" />
              {currentChunk?.author || doc?.author || 'Uncredited'}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">RECORD DATE</span>
            <span className="font-semibold text-zinc-200 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-zinc-500" />
              {formatDate(currentChunk?.publication_date || doc?.publication_date)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block font-medium">ORIGINAL FILENAME</span>
            <span className="font-mono text-zinc-300 truncate block mt-0.5" title={doc?.original_filename}>
              {doc?.original_filename || 'archived_record'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-900">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-400 font-mono">Retrieving surrounding archive context...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-md text-red-200 text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Surrounding Context: Previous Chunk */}
              {prevChunk && (
                <div className="space-y-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    PREVIOUS ARCHIVE SECTION (Chunk #{prevChunk.chunk_index + 1})
                  </div>
                  <div className="p-3.5 bg-zinc-950/80 rounded-md border border-dashed border-zinc-800 text-xs font-serif leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {prevChunk.text}
                  </div>
                </div>
              )}

              {/* Exact Evidence Chunk */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <ShieldCheck className="w-4 h-4 text-red-500" />
                    EXACT ARCHIVAL EVIDENCE USED BY AI (Chunk #{currentChunk?.chunk_index + 1})
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    Chunk ID: {currentChunk?.id}
                  </span>
                </div>
                <div className="p-4 bg-red-950/25 rounded-md border-2 border-red-800/80 text-sm font-serif leading-relaxed text-zinc-100 shadow-md whitespace-pre-wrap">
                  {currentChunk?.text}
                </div>
              </div>

              {/* Surrounding Context: Next Chunk */}
              {nextChunk && (
                <div className="space-y-1.5 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                    NEXT ARCHIVE SECTION (Chunk #{nextChunk.chunk_index + 1})
                  </div>
                  <div className="p-3.5 bg-zinc-950/80 rounded-md border border-dashed border-zinc-800 text-xs font-serif leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {nextChunk.text}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs">
          <div className="text-zinc-400 flex items-center gap-1">
            <span className="font-semibold text-zinc-200">Editorial Standard:</span> Full archival traceability verified.
          </div>
          <div className="flex items-center gap-2">
            {doc && onNavigateDocument && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateDocument(doc.id);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-200 bg-zinc-800 hover:bg-zinc-700 font-medium transition-colors cursor-pointer"
              >
                View Full Document <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-500 font-medium transition-colors cursor-pointer shadow-md shadow-red-950"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
