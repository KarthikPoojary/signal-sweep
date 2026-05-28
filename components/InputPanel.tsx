'use client';

import { useState } from 'react';
import type { RawIssue } from '@/types/analysis';

export type InputMode = 'sample' | 'paste' | 'github';

interface Props {
  onAnalyse: (issues: Pick<RawIssue, 'title' | 'body'>[], isDemo: boolean, apiKey?: string) => void;
  loading: boolean;
}

function parseTextInput(raw: string): Pick<RawIssue, 'title' | 'body'>[] {
  const trimmed = raw.trim();
  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(item =>
        typeof item === 'string'
          ? { title: item, body: null }
          : { title: String(item.title ?? item.name ?? item), body: item.body ?? item.description ?? null }
      );
    }
  } catch { /* fall through */ }
  // One per line
  return trimmed.split('\n').filter(l => l.trim()).map(l => ({ title: l.trim(), body: null }));
}

export default function InputPanel({ onAnalyse, loading }: Props) {
  const [mode, setMode] = useState<InputMode>('sample');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');

  // GitHub fetch state
  const [ghOwnerRepo, setGhOwnerRepo] = useState('');
  const [ghLabel, setGhLabel] = useState('bug');
  const [ghCount, setGhCount] = useState('50');
  const [ghIssues, setGhIssues] = useState<Pick<RawIssue, 'title' | 'body'>[] | null>(null);
  const [ghFetching, setGhFetching] = useState(false);
  const [ghError, setGhError] = useState('');

  // API key state (shown for paste/github mode)
  const [apiKey, setApiKey] = useState('');
  const [showKeyPanel, setShowKeyPanel] = useState(false);

  async function handleFetchGitHub() {
    const parts = ghOwnerRepo.trim().split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setGhError('Use format owner/repo (e.g. microsoft/vscode)');
      return;
    }
    setGhFetching(true);
    setGhError('');
    setGhIssues(null);
    try {
      const params = new URLSearchParams({ owner: parts[0], repo: parts[1], label: ghLabel, count: ghCount });
      const res = await fetch(`/api/github?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setGhIssues(data.issues);
    } catch (e) {
      setGhError(e instanceof Error ? e.message : 'Fetch failed');
    } finally {
      setGhFetching(false);
    }
  }

  function handleAnalyse() {
    if (mode === 'sample') {
      onAnalyse([], true);
      return;
    }
    if (mode === 'paste') {
      const issues = parseTextInput(pasteText);
      if (!issues.length) { setPasteError('No valid issues found'); return; }
      if (issues.length > 200) { setPasteError('Maximum 200 issues'); return; }
      setPasteError('');
      onAnalyse(issues, false, apiKey || undefined);
      return;
    }
    if (mode === 'github') {
      if (!ghIssues?.length) { setGhError('Fetch issues first'); return; }
      onAnalyse(ghIssues, false, apiKey || undefined);
      return;
    }
  }

  const canAnalyse =
    mode === 'sample' ||
    (mode === 'paste' && pasteText.trim().length > 0) ||
    (mode === 'github' && ghIssues !== null && ghIssues.length > 0);

  const needsKey = mode !== 'sample';

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(
          [
            { id: 'sample' as const, label: 'Sample dataset', sub: '44 real VS Code bug reports — no API key needed' },
            { id: 'paste' as const, label: 'Paste your own',  sub: 'Incidents, tickets, or GitHub issues — one per line or JSON' },
            { id: 'github' as const, label: 'Fetch from GitHub', sub: 'Pull live issues from any public repository' },
          ] as const
        ).map(opt => (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            className={`px-4 py-3 rounded-lg border text-left transition-colors ${
              mode === opt.id
                ? 'border-indigo-500 bg-indigo-950/60'
                : 'border-neutral-700 bg-neutral-900 hover:border-neutral-500'
            }`}
          >
            <p className={`text-sm font-medium ${mode === opt.id ? 'text-indigo-300' : 'text-neutral-300'}`}>{opt.label}</p>
            <p className="text-[11px] text-neutral-600 mt-0.5">{opt.sub}</p>
          </button>
        ))}
      </div>

      {/* Paste panel */}
      {mode === 'paste' && (
        <div className="space-y-2">
          <textarea
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setPasteError(''); }}
            placeholder={"One incident per line:\nLogin page returns 500 after deploy\nSearch results empty for new users\n...\n\nOr paste a JSON array: [{\"title\": \"...\", \"body\": \"...\"}]"}
            rows={8}
            className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 font-mono text-xs placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 resize-y"
          />
          {pasteText.trim() && (
            <p className="text-xs text-neutral-500">
              {parseTextInput(pasteText).length} items detected
            </p>
          )}
          {pasteError && <p className="text-xs text-red-400">{pasteError}</p>}
        </div>
      )}

      {/* GitHub fetch panel */}
      {mode === 'github' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={ghOwnerRepo}
              onChange={e => { setGhOwnerRepo(e.target.value); setGhError(''); }}
              placeholder="owner/repo (e.g. microsoft/vscode)"
              className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 font-mono text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
            />
            <input
              type="text"
              value={ghLabel}
              onChange={e => setGhLabel(e.target.value)}
              placeholder="label"
              className="w-28 px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 font-mono text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
            />
            <select
              value={ghCount}
              onChange={e => setGhCount(e.target.value)}
              className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-300 text-sm focus:outline-none focus:border-neutral-500"
            >
              {['25', '50', '75', '100'].map(n => <option key={n}>{n}</option>)}
            </select>
            <button
              onClick={handleFetchGitHub}
              disabled={ghFetching}
              className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {ghFetching ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
          {ghIssues && (
            <p className="text-xs text-green-400">{ghIssues.length} issues fetched — ready to analyse</p>
          )}
          {ghError && <p className="text-xs text-red-400">{ghError}</p>}
        </div>
      )}

      {/* API key panel for real analysis */}
      {needsKey && (
        <div className="space-y-2">
          <button
            onClick={() => setShowKeyPanel(k => !k)}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            {showKeyPanel ? 'Hide' : 'Add your Anthropic API key to run real analysis'}
          </button>
          {showKeyPanel && (
            <div className="space-y-1">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="gsk_... (Groq, free) or sk-ant-... (Anthropic)"
                className="w-full px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 font-mono text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500"
              />
              <p className="text-[11px] text-neutral-600">
                Free Groq key: <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-400">console.groq.com/keys</a> — takes 2 minutes. Key stays in the browser, never stored.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analyse button */}
      <button
        onClick={handleAnalyse}
        disabled={!canAnalyse || loading}
        className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Analysing...' : 'Analyse'}
      </button>
    </div>
  );
}
