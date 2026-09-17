import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import CitationBadge from './CitationBadge';

export default function EvidenceCard({ text, citations = [], onClickCitation }) {
  return (
    <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-800 leading-relaxed flex items-start gap-2.5">
      <ShieldCheck className="w-4 h-4 text-brand-800 shrink-0 mt-0.5" />
      <div className="space-y-1 flex-1">
        <p className="font-serif">{text}</p>
        {citations.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Corroboration:
            </span>
            {citations.map((cId) => (
              <CitationBadge
                key={cId}
                id={cId}
                onClick={() => onClickCitation && onClickCitation(cId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
