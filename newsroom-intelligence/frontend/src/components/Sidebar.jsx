import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  HelpCircle,
  Search,
  Briefcase,
  FileText,
} from 'lucide-react';
import api from '../services/api';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ask', label: 'Ask the Archive', icon: HelpCircle },
  { path: '/search', label: 'Search Archive', icon: Search },
  { path: '/stories', label: 'Developing Stories', icon: Briefcase },
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
    <aside className={`w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 ${className}`}>
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-brand-800 flex items-center justify-center text-white shadow-xs font-serif font-bold text-lg">
            C
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Contexto
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
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
                    ? 'bg-brand-800 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status & Archive Counters */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium uppercase tracking-wider">
            Archive Engine
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block uppercase">Docs</span>
            <span className="font-mono font-bold text-slate-200">
              {stats?.documents_count ?? '--'}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block uppercase">Chunks</span>
            <span className="font-mono font-bold text-slate-200">
              {stats?.chunks_count ?? '--'}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block uppercase">Sources</span>
            <span className="font-mono font-bold text-slate-200">
              {stats?.sources_count ?? '--'}
            </span>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
          <span>FAISS Cosine Index</span>
          <span className="text-slate-400">All-MiniLM-L6</span>
        </div>
      </div>
    </aside>
  );
}
