import { NextRequest, NextResponse } from 'next/server';
import type { RawIssue } from '@/types/analysis';

interface GitHubIssue {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  closed_at: string | null;
  labels: Array<{ name: string }>;
  pull_request?: unknown;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const label = searchParams.get('label') || 'bug';
  const count = Math.min(parseInt(searchParams.get('count') || '50', 10), 100);

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;

  const url =
    `https://api.github.com/repos/${owner}/${repo}/issues` +
    `?state=all&labels=${encodeURIComponent(label)}&per_page=${count}&sort=created&direction=desc`;

  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) {
    const msg = res.status === 404 ? `Repository ${owner}/${repo} not found` : `GitHub API error ${res.status}`;
    return NextResponse.json({ error: msg }, { status: res.status });
  }

  const raw: GitHubIssue[] = await res.json();
  const issues: RawIssue[] = raw
    .filter(i => !i.pull_request)  // exclude PRs from issues endpoint
    .slice(0, count)
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

  return NextResponse.json({ issues, count: issues.length });
}
