'use client';

import { useState } from 'react';
import type { Cluster } from '@/types/analysis';

const SEVERITY_STYLES: Record<Cluster['severity'], { badge: string; bar: string }> = {
  high:   { badge: 'bg-red-950/60 border-red-800 text-red-400',   bar: 'bg-red-500' },
  medium: { badge: 'bg-amber-950/60 border-amber-800 text-amber-400', bar: 'bg-amber-500' },
  low:    { badge: 'bg-green-950/60 border-green-800 text-green-400', bar: 'bg-green-500' },
};

export default function ClusterCard({ cluster, maxCount }: { cluster: Cluster; maxCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const styles = SEVERITY_STYLES[cluster.severity];
  const pct = maxCount > 0 ? Math.round((cluster.count / maxCount) * 100) : 0;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${styles.badge}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-neutral-100 leading-snug">{cluster.name}</h3>
        <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[11px] font-medium uppercase tracking-wide ${styles.badge}`}>
          {cluster.severity}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-2xl font-bold text-neutral-100">{cluster.count}</span>
        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${styles.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="font-mono text-xs text-neutral-500">{pct}%</span>
      </div>

      <p className="text-xs text-neutral-400 leading-relaxed">{cluster.remediation_theme}</p>

      {cluster.example_titles.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {expanded ? 'Hide examples' : `Show ${cluster.example_titles.length} example${cluster.example_titles.length > 1 ? 's' : ''}`}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1">
              {cluster.example_titles.map((t, i) => (
                <li key={i} className="text-xs text-neutral-500 pl-3 border-l border-neutral-700 leading-relaxed">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
