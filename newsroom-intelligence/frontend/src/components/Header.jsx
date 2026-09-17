import React from 'react';
import { ShieldCheck, Search, PlusCircle, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, subtitle, actions }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <button
          onClick={() => navigate('/ask')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Ask Archive</span>
        </button>

        <button
          onClick={() => navigate('/documents/upload')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-brand-800 text-white hover:bg-brand-700 transition-colors cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Ingest Document</span>
        </button>
      </div>
    </header>
  );
}
