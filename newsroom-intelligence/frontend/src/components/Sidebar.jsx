import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  HelpCircle,
  Search,
  FileText,
} from 'lucide-react';
import api from '../services/api';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ask', label: 'Ask the Archive', icon: HelpCircle },
  { path: '/search', label: 'Search Archive', icon: Search },
  { path: '/documents', label: 'Archive Documents', icon: FileText },
];

export default function Sidebar({ className = '' }) {
  const [stats, setStats] = useState(null);
  const location = useLocation();

  useEffect(() => {
    api.getStatistics()
      .then((data) => setStats(data))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <aside className={`w-64 bg-black text-zinc-100 flex flex-col justify-between border-r border-zinc-850 border-zinc-800/80 ${className}`}>
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-zinc-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-950 font-serif font-bold text-lg">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Contexto
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              Evidence-Backed RAG
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white font-semibold shadow-lg shadow-red-950/60'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/90'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status & Archive Counters */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950 space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-400 font-medium uppercase tracking-wider">
            Archive Engine
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Online
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-zinc-900/90 p-2 rounded border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 block uppercase">Docs</span>
            <span className="font-mono font-bold text-zinc-200">
              {stats?.documents_count ?? '--'}
            </span>
          </div>
          <div className="bg-zinc-900/90 p-2 rounded border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 block uppercase">Chunks</span>
            <span className="font-mono font-bold text-zinc-200">
              {stats?.chunks_count ?? '--'}
            </span>
          </div>
          <div className="bg-zinc-900/90 p-2 rounded border border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 block uppercase">Sources</span>
            <span className="font-mono font-bold text-zinc-200">
              {stats?.sources_count ?? '--'}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between pt-1">
          <span>FAISS Cosine Index</span>
          <span className="text-zinc-400">All-MiniLM-L6</span>
        </div>
      </div>
    </aside>
  );
}
