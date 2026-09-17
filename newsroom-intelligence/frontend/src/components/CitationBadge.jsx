import React from 'react';

export default function CitationBadge({ id, onClick, source, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick(id, source);
      }}
      title={source ? `${source.title} (${source.date || 'Unknown date'})` : `Source [${id}]`}
      className={`inline-flex items-center justify-center font-mono font-bold text-xs px-1.5 py-0.5 mx-0.5 rounded border transition-all duration-150 cursor-pointer 
        bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-800 hover:text-white hover:border-brand-800 shadow-sm ${className}`}
    >
      [{id}]
    </button>
  );
}
