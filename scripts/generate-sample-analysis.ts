#!/usr/bin/env npx ts-node --esm
/**
 * One-off script: reads /data/sample-issues.json, calls an LLM once,
 * writes pre-baked analysis to /data/sample-analysis.json and
 * pre-baked exec summary to /data/sample-exec-summary.json.
 *
 * Run after fetch-sample-data.ts. Accepts a Groq key (free) or Anthropic key:
 *   GROQ_API_KEY=gsk_...      npx tsx scripts/generate-sample-analysis.ts
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/generate-sample-analysis.ts
 *
 * This is the ONE real API call that seeds the demo. After this, the demo
 * runs entirely from the pre-baked JSON — zero ongoing API cost.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT, buildExecSummaryPrompt, EXEC_SUMMARY_SYSTEM_PROMPT } from '../lib/prompt';
import { llmCall, detectProvider } from '../lib/llm';
import type { RawIssue, AnalysisResult } from '../types/analysis';

const KEY = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
if (!KEY) {
  console.error('Provide GROQ_API_KEY (free at console.groq.com) or ANTHROPIC_API_KEY');
  process.exit(1);
}

async function main() {
  const provider = detectProvider(KEY!);
  console.log(`Using provider: ${provider}`);

  const issues: RawIssue[] = JSON.parse(
    readFileSync(join(process.cwd(), 'data', 'sample-issues.json'), 'utf8')
  );
  console.log(`Loaded ${issues.length} issues.`);

  // ── Step 1: cluster analysis ─────────────────────────────────────────────
  console.log('Calling LLM for cluster analysis...');
  const analysisText = await llmCall({
    key: KEY!,
    system: ANALYSIS_SYSTEM_PROMPT,
    user: buildAnalysisPrompt(issues),
    maxTokens: 2048,
  });

  let analysis: AnalysisResult;
  try {
    analysis = JSON.parse(analysisText);
  } catch {
    const stripped = analysisText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    analysis = JSON.parse(stripped);
  }
  console.log(`Got ${analysis.clusters.length} clusters.`);

  writeFileSync(
    join(process.cwd(), 'data', 'sample-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );
  console.log('Written data/sample-analysis.json');

  // ── Step 2: executive summary ────────────────────────────────────────────
  console.log('Calling LLM for executive summary...');
  const execText = await llmCall({
    key: KEY!,
    system: EXEC_SUMMARY_SYSTEM_PROMPT,
    user: buildExecSummaryPrompt(JSON.stringify(analysis, null, 2)),
    maxTokens: 512,
  });

  writeFileSync(
    join(process.cwd(), 'data', 'sample-exec-summary.json'),
    JSON.stringify({ summary: execText.trim() }, null, 2)
  );
  console.log('Written data/sample-exec-summary.json');
  console.log('Done. Demo mode is fully seeded.');
}

main().catch(e => { console.error(e); process.exit(1); });
