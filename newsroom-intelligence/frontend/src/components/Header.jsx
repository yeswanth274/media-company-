import React from 'react';
import { ShieldCheck, Search, PlusCircle, Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, subtitle, actions }) {
  const navigate = useNavigate();

  return (
    <header className="bg-zinc-950/90 border-b border-zinc-800/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-zinc-400 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        <button
          onClick={() => navigate('/ask')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 text-red-400 border border-zinc-800 hover:bg-zinc-800 hover:border-red-900/60 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Ask Archive</span>
        </button>

        <button
          onClick={() => navigate('/documents/upload')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer shadow-md shadow-red-950/50"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Ingest Document</span>
        </button>
      </div>
    </header>
  );
}
