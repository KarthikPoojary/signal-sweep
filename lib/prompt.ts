import type { RawIssue } from '@/types/analysis';

export const ANALYSIS_SYSTEM_PROMPT = `You are a senior engineering manager with deep experience in post-incident review and root cause analysis. Your job is to analyse a batch of bug reports or incidents and identify recurring failure patterns.

You are precise, concise, and action-oriented. You cluster issues by root cause — not by surface symptom. You look for systemic themes, not one-off quirks. Your remediation suggestions are specific enough to put on a roadmap.

Return ONLY valid JSON. No markdown, no explanation outside the JSON object.`;

export function buildAnalysisPrompt(issues: Pick<RawIssue, 'title' | 'body'>[]) {
  const formatted = issues
    .map((i, idx) => `${idx + 1}. ${i.title}${i.body ? `\n   ${i.body.slice(0, 200)}` : ''}`)
    .join('\n\n');

  return `Analyse the following ${issues.length} bug reports / incidents and return a structured JSON analysis.

Cluster them into 5–10 root-cause themes, sorted by count descending. Each cluster should represent a distinct failure mode or systemic problem area — not a surface symptom.

Return this exact JSON schema:
{
  "top_level_summary": "<1-2 sentences: what is the overall health signal from this batch?>",
  "total_count": <number>,
  "clusters": [
    {
      "name": "<3-6 words: the failure mode>",
      "count": <number of issues in this cluster>,
      "severity": "<high|medium|low>",
      "example_titles": ["<up to 3 representative issue titles>"],
      "remediation_theme": "<1 sentence, action-oriented: what should the team do about this?>"
    }
  ],
  "key_insight": "<the most non-obvious finding from this batch — 1-2 sentences>"
}

Issues to analyse:

${formatted}`;
}

export const EXEC_SUMMARY_SYSTEM_PROMPT = `You are a technical program manager writing a concise status update for a VP of Engineering. You are direct, confident, and translate technical patterns into business risk and action items. No jargon. No bullet points. One paragraph.`;

export function buildExecSummaryPrompt(analysis: string): string {
  return `Based on the following incident analysis, write a single paragraph (4-6 sentences) suitable for sending to a VP of Engineering. Cover: what the data shows, the top risk area, and the recommended action. Be specific about numbers.

Analysis:
${analysis}`;
}
