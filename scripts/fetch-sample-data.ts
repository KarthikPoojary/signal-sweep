#!/usr/bin/env npx ts-node --esm
/**
 * One-off script: fetches ~50 real "bug" issues from microsoft/vscode
 * and writes them to /data/sample-issues.json.
 *
 * Run once during dev setup:
 *   npx ts-node --esm scripts/fetch-sample-data.ts
 *
 * Requires GITHUB_TOKEN in .env.local for best results (avoids rate limiting).
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { RawIssue } from '../types/analysis';

const TOKEN = process.env.GITHUB_TOKEN ?? '';
const OWNER = 'microsoft';
const REPO = 'vscode';
const LABEL = 'bug';
const COUNT = 50;

interface GitHubIssue {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  closed_at: string | null;
  labels: Array<{ name: string }>;
}

async function fetchIssues(): Promise<RawIssue[]> {
  const perPage = Math.min(COUNT, 100);
  const url =
    `https://api.github.com/repos/${OWNER}/${REPO}/issues` +
    `?state=closed&labels=${encodeURIComponent(LABEL)}&per_page=${perPage}&sort=created&direction=desc`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);

  const raw: GitHubIssue[] = await res.json();

  return raw
    .filter(i => !i.title.toLowerCase().startsWith('['))  // skip meta-issues
    .slice(0, COUNT)
    .map(i => ({
      id: i.id,
      title: i.title,
      body: i.body ? i.body.slice(0, 500) : null,
      labels: i.labels.map(l => l.name),
      created_at: i.created_at,
      closed_at: i.closed_at,
      state: i.state as 'open' | 'closed',
      url: i.html_url,
    }));
}

async function main() {
  console.log(`Fetching ${COUNT} ${LABEL} issues from ${OWNER}/${REPO}...`);
  const issues = await fetchIssues();
  console.log(`Got ${issues.length} issues.`);

  mkdirSync(join(process.cwd(), 'data'), { recursive: true });
  const outPath = join(process.cwd(), 'data', 'sample-issues.json');
  writeFileSync(outPath, JSON.stringify(issues, null, 2));
  console.log(`Written to ${outPath}`);
  console.log('Next: run scripts/generate-sample-analysis.ts to create the pre-baked analysis.');
}

main().catch(e => { console.error(e); process.exit(1); });
