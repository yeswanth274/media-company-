export function formatDate(dateString, fallbackDateString = null) {
  const target = dateString || fallbackDateString;
  if (!target) return 'Date unknown';

  try {
    let s = String(target).trim();
    if (!s) return 'Date unknown';

    // If PDF format e.g. D:20241022143000
    if (s.startsWith('D:')) {
      const match = s.match(/D:(\d{4})(\d{2})(\d{2})/);
      if (match) {
        s = `${match[1]}-${match[2]}-${match[3]}`;
      }
    }

    // Check if it's just a 4-digit year e.g. "2018" or "2018-01-01" when originally just year
    if (/^\d{4}$/.test(s)) {
      return s;
    }

    // Replace SQLite space separator with 'T' if needed for Date constructor
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T');
    }

    // Standard date parsing
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    // Fallback if parsing failed but target is readable text
    return s;
  } catch {
    return target || 'Date unknown';
  }
}

export function formatTime(dateString) {
  if (!dateString) return '';
  try {
    let s = String(dateString).trim();
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T');
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
}

export function formatDateTime(dateString, fallbackDateString = null) {
  const target = dateString || fallbackDateString;
  if (!target) return 'Date unknown';
  try {
    let s = String(target).trim();
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(' ', 'T');
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return target;
    const dateFormatted = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return target;
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
