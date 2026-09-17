export function formatDate(dateString) {
  if (!dateString) return 'Date unknown';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatSourceType(type) {
  if (!type) return 'Article';
  const map = {
    article: 'News Article',
    interview: 'Interview Record',
    transcript: 'Meeting Transcript',
    footage_note: 'Footage Note / Tape Log',
    court_filing: 'Court Record',
    memo: 'Internal Memo',
  };
  return map[type.toLowerCase()] || type.replace('_', ' ').toUpperCase();
}

export function getEvidenceBadgeProps(level) {
  switch (level?.toLowerCase()) {
    case 'strong':
      return {
        label: 'Strong Evidence',
        bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
        dot: 'bg-emerald-400',
        desc: 'Multiple corroborating archival sources verified without discrepancy.'
      };
    case 'moderate':
      return {
        label: 'Moderate Evidence',
        bg: 'bg-red-950/80 text-red-300 border-red-800',
        dot: 'bg-red-400',
        desc: 'Sufficient direct archival sources with partial corroboration.'
      };
    case 'limited':
      return {
        label: 'Limited Evidence',
        bg: 'bg-amber-950/80 text-amber-400 border-amber-800',
        dot: 'bg-amber-400',
        desc: 'Single source or isolated record; corroboration advised.'
      };
    case 'insufficient':
    default:
      return {
        label: 'Insufficient Evidence',
        bg: 'bg-zinc-900 text-zinc-400 border-zinc-700',
        dot: 'bg-zinc-500',
        desc: 'Archive records do not contain reliable evidence for this inquiry.'
      };
  }
}
