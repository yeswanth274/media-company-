import React from 'react';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';
import CitationBadge from './CitationBadge';
import { formatDate } from '../utils/formatters';

export default function Timeline({ events = [], onSelectCitation }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
        No chronological timeline events established from the retrieved archive records.
      </div>
    );
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((evt, idx) => {
        const isDateUncertain = !evt.date || evt.date.includes('not established') || evt.date === 'Unknown';
        
        return (
          <div key={idx} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-6 sm:-left-8 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs transition-colors ${
              evt.conflict_note ? 'bg-amber-500 ring-2 ring-amber-100' : 'bg-brand-800 ring-2 ring-brand-100'
            }`} />

            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-subtle transition-all space-y-2">
              {/* Header: Date + Conflict Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-800" />
                  <span className={`text-xs font-mono font-bold ${
                    isDateUncertain ? 'text-amber-700 italic' : 'text-slate-900'
                  }`}>
                    {isDateUncertain ? 'Date not established by retrieved archive evidence' : formatDate(evt.date)}
                  </span>
                </div>

                {evt.source_ids?.length > 0 && (
                  <div className="flex items-center gap-1">
                    {evt.source_ids.map((sId) => {
                      const matchingCit = evt.citations?.find((c) => c.id === sId);
                      return (
                        <CitationBadge
                          key={sId}
                          id={sId.replace('S', '')}
                          source={matchingCit}
                          onClick={() => onSelectCitation && onSelectCitation(matchingCit?.chunk_id || sId, sId)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Event Description */}
              <p className="text-xs font-serif leading-relaxed text-slate-800">
                {evt.event}
              </p>

              {/* Conflict Note if any */}
              {evt.conflict_note && (
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{evt.conflict_note}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
