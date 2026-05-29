'use client';

import { useState } from 'react';
import InputPanel from '@/components/InputPanel';
import AnalysisResults from '@/components/AnalysisResults';
import { SkeletonResults } from '@/components/SkeletonCard';
import type { AnalysisResult, RawIssue } from '@/types/analysis';

// Pre-baked data — served from repo, zero API cost in demo mode
import sampleAnalysis from '@/data/sample-analysis.json';
import sampleExecSummary from '@/data/sample-exec-summary.json';

type State =
  | { phase: 'idle' }
  | { phase: 'loading'; count: number }
  | { phase: 'done'; analysis: AnalysisResult; isDemo: boolean; apiKey?: string }
  | { phase: 'error'; message: string };

export default function Home() {
  const [state, setState] = useState<State>({ phase: 'idle' });

  async function handleAnalyse(
    issues: Pick<RawIssue, 'title' | 'body'>[],
    isDemo: boolean,
    apiKey?: string,
  ) {
    if (isDemo) {
      setState({ phase: 'done', analysis: sampleAnalysis as AnalysisResult, isDemo: true });
      return;
    }

    setState({ phase: 'loading', count: issues.length });

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues, apiKey }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const analysis: AnalysisResult = await res.json();
      setState({ phase: 'done', analysis, isDemo: false, apiKey });
    } catch (e) {
      setState({ phase: 'error', message: e instanceof Error ? e.message : 'Unexpected error' });
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <header className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Signal Sweep</h1>
          <p className="text-sm text-neutral-500">
            Find the patterns in your incident backlog — powered by Groq / Claude
          </p>
        </header>

        <InputPanel
          onAnalyse={handleAnalyse}
          loading={state.phase === 'loading'}
        />

        {state.phase === 'loading' && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-400 animate-pulse">
              Clustering {state.count} incidents...
            </p>
            <SkeletonResults />
          </div>
        )}

        {state.phase === 'error' && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 px-5 py-4">
            <p className="text-sm font-medium text-red-400">Analysis failed</p>
            <p className="text-xs text-red-400/70 mt-1">{state.message}</p>
            <button
              onClick={() => setState({ phase: 'idle' })}
              className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {state.phase === 'done' && (
          <AnalysisResults
            analysis={state.analysis}
            isDemo={state.isDemo}
            apiKey={state.apiKey}
            preBakedExecSummary={state.isDemo ? (sampleExecSummary as { summary: string }).summary : undefined}
          />
        )}

        <footer className="flex items-center justify-between pt-4 border-t border-neutral-900 text-xs text-neutral-700">
          <span>Built by Karthik Poojary</span>
          <div className="flex gap-4">
            <a href="https://github.com/KarthikPoojary" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">GitHub</a>
            <a href="https://linkedin.com/in/karthikpoojary" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">LinkedIn</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
