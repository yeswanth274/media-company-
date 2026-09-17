import React from 'react';
import { Search, FileQuestion, AlertCircle } from 'lucide-react';

export default function EmptyState({
  title = 'No archival records found',
  description = 'Try adjusting your search terms or expanding your date filters.',
  icon: Icon = Search,
  actionText,
  onAction,
}) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center shadow-xl space-y-4 text-zinc-100">
      <div className="w-12 h-12 mx-auto rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500">
        <Icon className="w-6 h-6 text-red-400" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-md shadow-red-950"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}
