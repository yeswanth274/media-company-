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
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        desc: 'Multiple corroborating archival sources verified without discrepancy.'
      };
    case 'moderate':
      return {
        label: 'Moderate Evidence',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        desc: 'Sufficient direct archival sources with partial corroboration.'
      };
    case 'limited':
      return {
        label: 'Limited Evidence',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        desc: 'Single source or isolated record; corroboration advised.'
      };
    case 'insufficient':
    default:
      return {
        label: 'Insufficient Evidence',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        desc: 'Archive records do not contain reliable evidence for this inquiry.'
      };
  }
}
