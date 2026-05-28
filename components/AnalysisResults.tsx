'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types/analysis';
import ClusterCard from './ClusterCard';

function exportMarkdown(analysis: AnalysisResult, execSummary?: string): string {
  const lines = [
    '# Signal Sweep — Incident Analysis',
    '',
    `**Summary:** ${analysis.top_level_summary}`,
    '',
    `**Total issues analysed:** ${analysis.total_count}`,
    '',
    `**Key insight:** ${analysis.key_insight}`,
    '',
  ];
  if (execSummary) {
    lines.push('## Executive Summary', '', execSummary, '');
  }
  lines.push('## Clusters');
  analysis.clusters.forEach(c => {
    lines.push('', `### ${c.name}`, `- Count: ${c.count}`, `- Severity: ${c.severity}`, `- Action: ${c.remediation_theme}`);
    if (c.example_titles.length) {
      lines.push('- Examples:');
      c.example_titles.forEach(t => lines.push(`  - ${t}`));
    }
  });
  return lines.join('\n');
}

function exportCsv(analysis: AnalysisResult): string {
  const rows = [['Cluster', 'Count', 'Severity', 'Remediation', 'Example 1', 'Example 2', 'Example 3']];
  analysis.clusters.forEach(c => {
    rows.push([
      `"${c.name}"`,
      String(c.count),
      c.severity,
      `"${c.remediation_theme}"`,
      `"${c.example_titles[0] ?? ''}"`,
      `"${c.example_titles[1] ?? ''}"`,
      `"${c.example_titles[2] ?? ''}"`,
    ]);
  });
  return rows.map(r => r.join(',')).join('\n');
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalysisResults({
  analysis,
  isDemo,
  apiKey,
  preBakedExecSummary,
}: {
  analysis: AnalysisResult;
  isDemo: boolean;
  apiKey?: string;
  preBakedExecSummary?: string;
}) {
  const [execSummary, setExecSummary] = useState<string | null>(preBakedExecSummary ?? null);
  const [execLoading, setExecLoading] = useState(false);
  const [execError, setExecError] = useState('');

  const maxCount = Math.max(...analysis.clusters.map(c => c.count), 1);

  async function handleExecSummary() {
    if (isDemo && preBakedExecSummary) {
      setExecSummary(preBakedExecSummary);
      return;
    }
    setExecLoading(true);
    setExecError('');
    try {
      const res = await fetch('/api/exec-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, apiKey }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setExecSummary(data.summary);
    } catch (e) {
      setExecError(e instanceof Error ? e.message : 'Failed to generate summary');
    } finally {
      setExecLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top summary banner */}
      <div className="rounded-xl border border-indigo-800 bg-indigo-950/40 px-5 py-4">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
          Summary · {analysis.total_count} issues analysed
        </p>
        <p className="text-sm text-neutral-200 leading-relaxed">{analysis.top_level_summary}</p>
        {isDemo && (
          <p className="text-xs text-neutral-600 mt-2">Demo mode — pre-baked analysis from 44 real VS Code bug reports</p>
        )}
      </div>

      {/* Key insight */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-4">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Key Insight</p>
        <p className="text-sm text-neutral-300 leading-relaxed">{analysis.key_insight}</p>
      </div>

      {/* Cluster grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {analysis.clusters.map((c, i) => (
          <ClusterCard key={i} cluster={c} maxCount={maxCount} />
        ))}
      </div>

      {/* Executive summary */}
      {execSummary ? (
        <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 px-5 py-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">Executive Summary</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{execSummary}</p>
        </div>
      ) : (
        <div>
          <button
            onClick={handleExecSummary}
            disabled={execLoading}
            className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {execLoading ? 'Generating...' : 'Generate executive summary'}
          </button>
          {execError && <p className="text-xs text-red-400 mt-2">{execError}</p>}
        </div>
      )}

      {/* Export buttons */}
      <div className="flex gap-3 pt-2 border-t border-neutral-900">
        <button
          onClick={() => downloadBlob(exportMarkdown(analysis, execSummary ?? undefined), 'signal-sweep-analysis.md', 'text/markdown')}
          className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 transition-colors"
        >
          Export markdown
        </button>
        <button
          onClick={() => downloadBlob(exportCsv(analysis), 'signal-sweep-analysis.csv', 'text/csv')}
          className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
