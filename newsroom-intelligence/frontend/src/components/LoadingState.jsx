import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Database, FileCheck } from 'lucide-react';

const STAGES = [
  { text: 'Searching archive vector space...', icon: Search },
  { text: 'Retrieving relevant historical evidence chunks...', icon: Database },
  { text: 'Analyzing facts and checking for discrepancies...', icon: ShieldCheck },
  { text: 'Validating citations and cross-checking SQLite records...', icon: FileCheck },
];

export default function LoadingState({ message = 'Researching archive...' }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = STAGES[stageIndex].icon;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-12 text-center shadow-xl space-y-4 text-zinc-100">
      <div className="w-12 h-12 mx-auto rounded-full bg-red-950/80 border border-red-900/60 flex items-center justify-center text-red-400 shadow-md shadow-red-950/50">
        <CurrentIcon className="w-6 h-6 animate-pulse" />
      </div>

      <div className="space-y-1.5 max-w-sm mx-auto">
        <h4 className="text-sm font-bold text-white">
          {message}
        </h4>
        <p className="text-xs text-zinc-400 font-mono transition-all">
          {STAGES[stageIndex].text}
        </p>
      </div>

      <div className="flex justify-center gap-1.5 pt-2">
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === stageIndex ? 'bg-red-500 w-5 shadow-red-glow' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
