import { NextRequest, NextResponse } from 'next/server';
import { llmCall } from '@/lib/llm';
import { buildExecSummaryPrompt, EXEC_SUMMARY_SYSTEM_PROMPT } from '@/lib/prompt';
import type { AnalysisResult } from '@/types/analysis';

export async function POST(req: NextRequest) {
  const { analysis, apiKey, adminPassword } = await req.json() as {
    analysis: AnalysisResult;
    apiKey?: string;
    adminPassword?: string;
  };

  let key: string | undefined;
  if (adminPassword && adminPassword === process.env.ADMIN_PASSWORD) {
    key = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
  } else {
    key = apiKey;
  }

  if (!key) return NextResponse.json({ error: 'No API key provided' }, { status: 401 });

  try {
    const summary = await llmCall({
      key,
      system: EXEC_SUMMARY_SYSTEM_PROMPT,
      user: buildExecSummaryPrompt(JSON.stringify(analysis, null, 2)),
      maxTokens: 512,
    });
    return NextResponse.json({ summary: summary.trim() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'LLM API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
