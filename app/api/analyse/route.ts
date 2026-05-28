import { NextRequest, NextResponse } from 'next/server';
import { llmCall } from '@/lib/llm';
import { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from '@/lib/prompt';
import type { RawIssue, AnalysisResult } from '@/types/analysis';

export async function POST(req: NextRequest) {
  const { issues, apiKey, adminPassword } = await req.json() as {
    issues: Pick<RawIssue, 'title' | 'body'>[];
    apiKey?: string;
    adminPassword?: string;
  };

  // Resolve which key to use — admin mode uses server-side key
  let key: string | undefined;
  if (adminPassword && adminPassword === process.env.ADMIN_PASSWORD) {
    key = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
  } else {
    key = apiKey;
  }

  if (!key) return NextResponse.json({ error: 'No API key provided' }, { status: 401 });
  if (!issues?.length) return NextResponse.json({ error: 'No issues provided' }, { status: 400 });
  if (issues.length > 200) return NextResponse.json({ error: 'Maximum 200 issues per analysis' }, { status: 400 });

  let text: string;
  try {
    text = await llmCall({
      key,
      system: ANALYSIS_SYSTEM_PROMPT,
      user: buildAnalysisPrompt(issues),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'LLM API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let analysis: AnalysisResult;
  try {
    analysis = JSON.parse(text);
  } catch {
    try {
      const stripped = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      analysis = JSON.parse(stripped);
    } catch {
      return NextResponse.json({ error: 'Model returned malformed JSON', raw: text }, { status: 502 });
    }
  }

  return NextResponse.json(analysis);
}
