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
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl overflow-hidden space-y-0 text-zinc-100">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-red-600 text-white shadow-md shadow-red-950">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Evidence-Backed Archival Synthesis
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
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
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Conflicting Accounts Alert Banner (if any) */}
      {conflicts && conflicts.length > 0 && (
        <div className="px-6 py-3.5 bg-red-950/40 border-b border-red-900/60 text-red-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Archive Discrepancy Detected (Conflicting Historical Accounts)
          </div>
          <div className="space-y-1.5">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="text-xs bg-zinc-950/80 p-2.5 rounded border border-red-900/50 leading-relaxed">
                <span className="font-semibold text-red-300">{conf.issue}: </span>
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
      <div className="p-6 space-y-5 bg-zinc-900">
        {evidence_level === 'insufficient' ? (
          <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>No Verified Archive Record Found</span>
            </div>
            <p className="text-sm font-serif leading-relaxed text-zinc-200">
              {answer}
            </p>
            <div className="pt-2 text-xs text-zinc-400 border-t border-zinc-800/80">
              💡 <span className="font-semibold text-zinc-300">Journalistic Guidance:</span> Newsroom Intelligence only answers questions verified by indexed documents. Try searching for specific people (e.g. <em className="text-zinc-200">Alex Morgan</em>, <em className="text-zinc-200">Elena Rostova</em>), organizations (<em className="text-zinc-200">Northstar Technologies</em>), or historical events.
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-base font-serif leading-relaxed text-zinc-100">
            {renderFormattedAnswer(answer)}
          </div>
        )}

        {/* Key Evidence Points (if present) */}
        {evidence_level !== 'insufficient' && key_evidence && key_evidence.length > 0 && (
          <div className="pt-4 border-t border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Key Documented Facts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {key_evidence.map((item, idx) => (
                <div key={idx} className="p-3 bg-zinc-950/90 rounded border border-zinc-800 text-xs text-zinc-300 leading-snug flex items-start gap-2">
                  <span className="text-red-500 font-bold">•</span>
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
        <div className="border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="w-full px-6 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>Cited Archival Sources ({citations.length})</span>
            </div>
            {sourcesExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
          </button>

          {sourcesExpanded && (
            <div className="px-6 pb-6 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              {citations.map((cit) => (
                <div
                  key={cit.id}
                  onClick={() => onSelectCitation(cit.chunk_id, cit.id)}
                  className="p-3.5 bg-zinc-900/90 rounded-md border border-zinc-800 hover:border-red-600 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/80 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        [{cit.id}]
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase">
                        {formatSourceType(cit.source_type)}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {formatDate(cit.date)}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-red-400 transition-colors">
                    {cit.title}
                  </h5>

                  <p className="text-[11px] font-serif text-zinc-300 line-clamp-2 leading-relaxed bg-zinc-950/90 p-2 rounded border border-zinc-800/80">
                    "{cit.excerpt}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>{cit.publication || 'Archival record'}</span>
                    <span className="text-red-400 font-medium group-hover:underline flex items-center gap-0.5">
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
