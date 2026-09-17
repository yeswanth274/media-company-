import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Briefcase,
  Sparkles,
  Download,
  Printer,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import Header from '../components/Header';
import CitationBadge from '../components/CitationBadge';
import Timeline from '../components/Timeline';
import LoadingState from '../components/LoadingState';
import api from '../services/api';
import { formatDate, formatSourceType, getEvidenceBadgeProps } from '../utils/formatters';

export default function DevelopingStory() {
  const [searchParams] = useSearchParams();
  const initialTitle = searchParams.get('title') || 'Northstar Technologies Investigation';

  const [storyTitle, setStoryTitle] = useState(initialTitle);
  const [researchQuestion, setResearchQuestion] = useState(
    'What previous investigations, whistleblower disclosures, and regulatory enforcement actions involved Northstar Technologies?'
  );
  const [tags, setTags] = useState('Northstar, Municipal Corruption, Telemetry, Investigation');

  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedStories, setSavedStories] = useState([]);

  const { onSelectCitation } = useOutletContext() || {};

  const fetchSavedStories = async () => {
    try {
      const stories = await api.getStories();
      setSavedStories(stories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSavedStories();
  }, []);

  const handleGenerateBriefing = async (e) => {
    if (e) e.preventDefault();
    if (!storyTitle.trim() || !researchQuestion.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await api.createResearch({
        title: storyTitle.trim(),
        research_question: researchQuestion.trim(),
        tags: tags.trim()
      });
      setBriefing(result);
      fetchSavedStories();
    } catch (err) {
      setError(err.message || 'Failed to assemble investigative dossier.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!briefing) return;
    let md = `# INVESTIGATIVE RESEARCH BRIEFING: ${briefing.title}\n\n`;
    md += `**Research Question:** ${briefing.research_question}\n`;
    md += `**Date Assembled:** ${new Date().toLocaleDateString()}\n`;
    md += `**Evidence Strength:** ${briefing.evidence_level?.toUpperCase()}\n\n`;
    md += `---\n\n`;

    md += `## 1. HISTORICAL BACKGROUND\n${briefing.background}\n\n`;

    if (briefing.key_developments?.length > 0) {
      md += `## 2. KEY DEVELOPMENTS\n`;
      briefing.key_developments.forEach((d) => {
        md += `- ${d}\n`;
      });
      md += `\n`;
    }

    if (briefing.timeline?.length > 0) {
      md += `## 3. CHRONOLOGICAL TIMELINE\n`;
      briefing.timeline.forEach((t) => {
        md += `- **${t.date}:** ${t.event} ${t.source_ids?.map((s) => `[${s}]`).join(' ')}\n`;
      });
      md += `\n`;
    }

    if (briefing.key_people?.length > 0) {
      md += `## 4. KEY ENTITIES & WITNESSES\n`;
      briefing.key_people.forEach((p) => {
        md += `- **${p.name}** (${p.role}): ${p.relevance}\n`;
      });
      md += `\n`;
    }

    if (briefing.conflicting_accounts?.length > 0) {
      md += `## 5. CONFLICTING HISTORICAL ACCOUNTS\n`;
      briefing.conflicting_accounts.forEach((c) => {
        md += `- **${c.issue}:** ${c.description} (Sources: ${c.conflicting_sources?.join(', ')})\n`;
      });
      md += `\n`;
    }

    if (briefing.open_questions?.length > 0) {
      md += `## 6. OPEN INVESTIGATIVE QUESTIONS\n`;
      briefing.open_questions.forEach((q) => {
        md += `- [ ] ${q}\n`;
      });
      md += `\n`;
    }

    if (briefing.sources?.length > 0) {
      md += `## 7. CITED ARCHIVAL SOURCES\n`;
      briefing.sources.forEach((s) => {
        md += `[${s.id}] **${s.title}** (${s.publication || 'Archive'}, ${s.date || 'Unknown Date'}). Excerpt: "${s.excerpt}"\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Briefing_${briefing.title.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const badgeProps = getEvidenceBadgeProps(briefing?.evidence_level);

  return (
    <div className="space-y-6 pb-16 bg-zinc-950 text-zinc-100 min-h-full">
      <Header
        title="Developing Story Workspace"
        subtitle="Construct full investigative dossiers and verified research briefings from archive records."
        actions={
          briefing && (
            <div className="flex items-center gap-2 no-print">
              <button
                onClick={handleExportMarkdown}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 text-zinc-200 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown</span>
              </button>
              <button
                onClick={handlePrintPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-500 text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-red-950"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF / Print</span>
              </button>
            </div>
          )
        }
      />

      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Story Workspace Setup Form (Hidden during PDF print) */}
        <div className="bg-zinc-900/90 rounded-lg border border-zinc-800 p-6 shadow-xl space-y-4 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Story Dossier Setup
              </h3>
            </div>
          </div>

          <form onSubmit={handleGenerateBriefing} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  Story Title
                </label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="e.g. Northstar Technologies Investigation"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:bg-zinc-950 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                  Topic / Entity Tags
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. Northstar, Alex Morgan, 2018 Probe"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:bg-zinc-950 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">
                Central Investigative Question
              </label>
              <textarea
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                rows={2}
                placeholder="What previous investigations, whistleblower disclosures, and regulatory enforcement actions involved Northstar?"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:bg-zinc-950 focus:outline-none focus:border-red-600 font-serif"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-zinc-500">
                Retrieves background, timeline, key witnesses, conflicting accounts, and sources.
              </span>
              <button
                type="submit"
                disabled={loading || !storyTitle.trim() || !researchQuestion.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-red-500 disabled:opacity-50 cursor-pointer shadow-md shadow-red-950 transition-all"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Generate Research Briefing</span>
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingState message="Assembling comprehensive investigative briefing from archival evidence..." />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Generated Briefing Presentation */}
        {briefing && !loading && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl p-8 sm:p-10 space-y-10 text-zinc-100">
            {/* Editorial Briefing Header */}
            <div className="border-b-2 border-red-600 pb-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-400 bg-red-950/80 border border-red-800 px-2.5 py-0.5 rounded">
                  Editorial Research Briefing
                </span>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${badgeProps.bg}`}
                >
                  <span className={`w-2 h-2 rounded-full ${badgeProps.dot}`} />
                  {badgeProps.label}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-white">
                {briefing.title}
              </h1>

              <div className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs font-serif italic text-zinc-300">
                <strong className="not-italic text-red-400 font-sans font-bold uppercase">Investigative Objective:</strong> {briefing.research_question}
              </div>
            </div>

            {/* Section 1: Historical Background */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                1. Historical Background
              </h3>
              <p className="text-sm font-serif leading-relaxed text-zinc-300 whitespace-pre-wrap">
                {briefing.background}
              </p>
            </div>

            {/* Section 2: Key Developments */}
            {briefing.key_developments?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-500" />
                  2. Key Developments
                </h3>
                <ul className="space-y-2 text-xs font-serif leading-relaxed text-zinc-300">
                  {briefing.key_developments.map((dev, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-zinc-950/80 p-2.5 rounded border border-zinc-800/80">
                      <span className="font-mono text-red-500 font-bold">•</span>
                      <span>{dev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 3: Verified Chronological Timeline */}
            {briefing.timeline?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  3. Verified Chronological Timeline
                </h3>
                <Timeline events={briefing.timeline} onSelectCitation={onSelectCitation} />
              </div>
            )}

            {/* Section 4: Key Entities & Witnesses */}
            {briefing.key_people?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-500" />
                  4. Key Entities & Witnesses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {briefing.key_people.map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-zinc-950/80 rounded border border-zinc-800 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <h4 className="text-xs font-bold text-white">{p.name}</h4>
                        <span className="text-[11px] font-mono text-zinc-400">{p.role}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-serif leading-relaxed">
                        {p.relevance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Conflicting Historical Accounts */}
            {briefing.conflicting_accounts?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 border-b border-red-900/60 pb-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  5. Conflicting Historical Accounts (Discrepancies)
                </h3>
                <div className="space-y-2">
                  {briefing.conflicting_accounts.map((conf, idx) => (
                    <div key={idx} className="p-3.5 bg-red-950/40 rounded border border-red-900/60 text-xs text-red-200 space-y-1">
                      <div className="font-bold text-red-300">{conf.issue}</div>
                      <p className="font-serif leading-relaxed">{conf.description}</p>
                      {conf.conflicting_sources?.length > 0 && (
                        <div className="text-[11px] text-red-400 font-mono pt-1">
                          Sources involved: {conf.conflicting_sources.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: Open Investigative Questions */}
            {briefing.open_questions?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-red-500" />
                  6. Open Investigative Questions
                </h3>
                <div className="space-y-1.5 text-xs text-zinc-300">
                  {briefing.open_questions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-zinc-950/80 rounded border border-zinc-800">
                      <span className="font-mono text-red-400">[{idx + 1}]</span>
                      <span className="font-serif">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 7: Cited Archival Sources */}
            {briefing.sources?.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-500" />
                  7. Archival Source Attributions ({briefing.sources.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {briefing.sources.map((src) => (
                    <div
                      key={src.id}
                      onClick={() => onSelectCitation && onSelectCitation(src.chunk_id, src.id)}
                      className="p-3 bg-zinc-950 rounded border border-zinc-800 hover:border-red-600 transition-all cursor-pointer space-y-1 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded border border-red-800">
                          [{src.id}]
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">{formatDate(src.date)}</span>
                      </div>
                      <h5 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                        {src.title}
                      </h5>
                      <p className="text-[11px] font-serif text-zinc-400 line-clamp-2 bg-zinc-900 p-1.5 rounded border border-zinc-800">
                        "{src.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
