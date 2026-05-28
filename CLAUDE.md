# Signal Sweep
*Last updated: 2026-05-28 (Claude session)*

## One-sentence pitch
A single-page web app that ingests a batch of incidents or bug reports and uses Claude to cluster them by root cause, identify recurring failure patterns, and recommend remediation themes.

## Current status
- **Works:** Full UI built. TypeScript clean. Dev server running at http://localhost:3001.
- **Partially built:** Sample data has 44 real VS Code issues in `data/sample-issues.json` but `data/sample-analysis.json` and `data/sample-exec-summary.json` are placeholders — one real Claude call needed via `scripts/generate-sample-analysis.ts`.
- **Not yet done:** GitHub repo not created, not deployed to Vercel, README not written.
- **Last worked on:** Initial scaffold + full UI build (2026-05-28).

## Tech stack
- Next.js 16.2.6 (App Router, TypeScript)
- React (canary, bundled with Next.js 16)
- Tailwind CSS v4 (`@import "tailwindcss"` in globals.css)
- `groq-sdk` — default LLM provider (free tier, Llama 3.3 70B)
- `@anthropic-ai/sdk` — fallback LLM provider (pay-per-use, Claude Opus)
- `lib/llm.ts` — unified LLM abstraction, auto-detects provider from key prefix (`gsk_` = Groq, `sk-ant-` = Anthropic)
- GitHub REST API via native `fetch()` — no SDK
- No database
- Deployment target: Vercel Hobby (signal-sweep.vercel.app)

## Key files and their purpose
```
types/analysis.ts                   — Shared TS types: RawIssue, Cluster, AnalysisResult
lib/llm.ts                          — Unified LLM call: auto-detects Groq vs Anthropic from key prefix
lib/prompt.ts                       — System prompts + prompt builder functions (provider-agnostic)
data/sample-issues.json             — 44 real closed "bug" issues from microsoft/vscode (fetched 2026-05-28)
data/sample-analysis.json           — Pre-baked cluster analysis (PLACEHOLDER — run seed script)
data/sample-exec-summary.json       — Pre-baked exec summary (PLACEHOLDER — run seed script)
scripts/fetch-sample-data.ts        — One-off: fetches vscode issues → sample-issues.json
scripts/generate-sample-analysis.ts — One-off: calls Claude once → sample-analysis.json + sample-exec-summary.json
app/page.tsx                        — Main page (client component): idle/loading/done/error state machine
app/api/analyse/route.ts            — POST: Claude cluster analysis (visitor key or admin key)
app/api/exec-summary/route.ts       — POST: VP-ready exec summary paragraph
app/api/github/route.ts             — GET: proxies GitHub issues API, strips PRs, caps at 100
components/InputPanel.tsx           — Client: 3-mode input (sample/paste/github) + API key panel
components/ClusterCard.tsx          — Client: expandable cluster card with severity colour + bar
components/AnalysisResults.tsx      — Client: summary banner, insight card, cluster grid, exec summary, exports
components/SkeletonCard.tsx         — Loading skeletons: SkeletonCluster + SkeletonResults
app/layout.tsx                      — Root layout, Geist fonts, dark background
app/globals.css                     — Tailwind v4, forced dark theme
.env.local.example                  — Env var template
```

## Design decisions and rationale
- **Demo mode (zero API cost):** Default loads pre-baked JSON. No LLM call for the sample dataset. Visitor must provide their own key for real analysis. Protects against a LinkedIn share burning API budget.
- **Groq as default provider:** Free tier (1,000 req/day), Llama 3.3 70B. Visitors get a free key in 2 minutes at console.groq.com. Lowers the barrier to "try with your own data" to zero cost. Anthropic still supported — auto-detected from `sk-ant-` key prefix.
- **Visitor-key model:** Key stays in browser state only, sent per-request, never stored server-side.
- **Admin mode:** `ADMIN_PASSWORD` env var unlocks analysis using server-side `GROQ_API_KEY` (or `ANTHROPIC_API_KEY` as fallback). Hidden "?" in footer (not yet built).
- **`'use client'` on page.tsx:** Analyse flow needs client state. API routes handle all LLM/GitHub calls so keys never reach client JS.
- **Retry on malformed JSON:** Route strips markdown fences and retries parse once before returning 502.

## Conventions
- All Claude prompts live in `lib/prompt.ts` — never inline in route files.
- Types shared from `types/analysis.ts`.
- Dark theme only. `bg-neutral-950` on html + body.
- Severity: red=high, amber=medium, green=low.
- No emoji. Font-mono for counts.
- `searchParams` must be awaited (Next.js 16) — not yet used but relevant if query-param state added.

## Environment variables
| Variable | Purpose | Required |
|---|---|---|
| `GROQ_API_KEY` | Groq key for admin mode (free at console.groq.com) | Preferred if ADMIN_PASSWORD set |
| `ANTHROPIC_API_KEY` | Anthropic key for admin mode fallback | Optional |
| `GITHUB_TOKEN` | GitHub PAT for /api/github | Optional (60 req/hr unauth) |
| `ADMIN_PASSWORD` | Unlocks server-side LLM calls | Optional |

## Open questions / parked items
- **Admin mode "?" footer button** — described in spec, not yet built.
- **Model selector for visitor key** — claude-opus-4-7 by default; could offer Haiku option.
- **Paste mode body parsing** — one-per-line only uses title. Could support `title\tbody` tab-separated.
- **LinkedIn URL slug** — verify `karthikpoojary` is correct before deploying.
- **Rate limiting on /api/analyse** — none currently. Add if real traffic arrives.

## Next steps
1. Run seed script: `GROQ_API_KEY=gsk_... npx tsx scripts/generate-sample-analysis.ts` (free Groq key from console.groq.com)
2. Create GitHub repo (KarthikPoojary/signal-sweep) and push
3. Add admin mode "?" button in footer
4. Write README
5. Deploy to Vercel, set ANTHROPIC_API_KEY, GITHUB_TOKEN, ADMIN_PASSWORD env vars

## Session log

### 2026-05-28
- Scaffolded Next.js 16.2.6, Tailwind v4, installed @anthropic-ai/sdk ^0.100.0
- Fetched 44 real microsoft/vscode "bug" issues into data/sample-issues.json
- Created types/analysis.ts, lib/prompt.ts, all seed scripts
- Built InputPanel (3-mode + API key panel), ClusterCard, AnalysisResults (exports included), SkeletonCard
- Built /api/analyse, /api/exec-summary, /api/github routes
- Built main page with idle/loading/done/error state machine
- data/sample-analysis.json and sample-exec-summary.json are placeholders pending seed script run
- TypeScript clean, dev server live at http://localhost:3001
