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
        bg-red-950/80 text-red-400 border-red-800/80 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm ${className}`}
    >
      [{id}]
    </button>
  );
}
