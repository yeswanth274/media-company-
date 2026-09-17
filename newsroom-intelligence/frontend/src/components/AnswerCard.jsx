import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Copy, Check, ExternalLink, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import CitationBadge from './CitationBadge';
import { getEvidenceBadgeProps, formatDate, formatSourceType } from '../utils/formatters';

export default function AnswerCard({ response, onSelectCitation, onSelectSource }) {
  const [copied, setCopied] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  if (!response) return null;

  const { answer, evidence_level, key_evidence, conflicts, citations, validation_status } = response;
  const badgeProps = getEvidenceBadgeProps(evidence_level);

  // Map citation ID -> CitationItem
  const citationMap = {};
  citations?.forEach((c) => {
    citationMap[c.id] = c;
  });

  // Render answer text with interactive CitationBadges
  const renderFormattedAnswer = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[S\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(S\d+)\]/);
      if (match) {
        const citId = match[1];
        const source = citationMap[citId];
        return (
          <CitationBadge
            key={i}
            id={citId}
            source={source}
            onClick={() => onSelectCitation(source?.chunk_id || citId, citId)}
          />
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-subtle overflow-hidden space-y-0 text-slate-900">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-brand-800 text-white">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Evidence-Backed Archival Synthesis
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Journalistic research standard • Strict citation grounded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Evidence Strength Pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeProps.bg}`}
            title={badgeProps.desc}
          >
            <span className={`w-2 h-2 rounded-full ${badgeProps.dot}`} />
            {badgeProps.label}
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Conflicting Accounts Alert Banner (if any) */}
      {conflicts && conflicts.length > 0 && (
        <div className="px-6 py-3.5 bg-amber-50/80 border-b border-amber-200 text-amber-900 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Archive Discrepancy Detected (Conflicting Historical Accounts)
          </div>
          <div className="space-y-1.5">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="text-xs bg-white/70 p-2.5 rounded border border-amber-200/60 leading-relaxed">
                <span className="font-semibold text-amber-950">{conf.issue}: </span>
                {conf.description}
                {conf.conflicting_sources?.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center gap-1">
                    {conf.conflicting_sources.map((srcId) => (
                      <CitationBadge
                        key={srcId}
                        id={srcId.replace('S', '')}
                        source={citationMap[srcId]}
                        onClick={() => onSelectCitation(citationMap[srcId]?.chunk_id, srcId)}
                      />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Answer Narrative */}
      <div className="p-6 space-y-5">
        <div className="prose prose-slate max-w-none text-base font-serif leading-relaxed text-slate-900 bg-white">
          {renderFormattedAnswer(answer)}
        </div>

        {/* Key Evidence Points (if present) */}
        {key_evidence && key_evidence.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Key Documented Facts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {key_evidence.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-snug flex items-start gap-2">
                  <span className="text-brand-800 font-bold">•</span>
                  <div className="flex-1">
                    <span>{item.text}</span>
                    <span className="ml-1 inline-flex items-center gap-0.5">
                      {item.citations?.map((cid) => (
                        <CitationBadge
                          key={cid}
                          id={cid}
                          source={citationMap[cid]}
                          onClick={() => onSelectCitation(citationMap[cid]?.chunk_id, cid)}
                        />
                      ))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Sources Section */}
      {citations && citations.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-brand-800" />
              <span>Cited Archival Sources ({citations.length})</span>
            </div>
            {sourcesExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {sourcesExpanded && (
            <div className="px-6 pb-6 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              {citations.map((cit) => (
                <div
                  key={cit.id}
                  onClick={() => onSelectCitation(cit.chunk_id, cit.id)}
                  className="p-3.5 bg-white rounded-md border border-slate-200 hover:border-brand-500 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200 group-hover:bg-brand-800 group-hover:text-white transition-colors">
                        [{cit.id}]
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase">
                        {formatSourceType(cit.source_type)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(cit.date)}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-brand-800 transition-colors">
                    {cit.title}
                  </h5>

                  <p className="text-[11px] font-serif text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-1.5 rounded border border-slate-100">
                    "{cit.excerpt}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{cit.publication || 'Archival record'}</span>
                    <span className="text-brand-800 font-medium group-hover:underline flex items-center gap-0.5">
                      Inspect Excerpt & Context &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
