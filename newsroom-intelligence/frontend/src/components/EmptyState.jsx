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
    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-subtle space-y-4">
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-md hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}
