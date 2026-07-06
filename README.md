# RAI Pulse

A personal, curated briefing on AI governance — regulation, standards, enforcement and the occasional paper worth reading twice. Built to keep the signal separate from the noise, and, honestly, to prove I could build it.

**Live sections:**

- **Regulatory feed** — latest AI regulation coverage from a fixed allowlist of quality sources (Reuters, FT, Politico, BBC, MIT Tech Review and others)
- **The governance angle** — general tech/AI news annotated with a short, AI-generated take on what each story means for governance, compliance and accountability
- **Geopolitics watch** — four-region snapshot (North America, Europe, Asia-Pacific, Rest of World) of national AI strategy, chip policy and investment, summarised daily
- **Radar** — upcoming deadlines, open consultations and enforcement signals
- **Themes** — reading lists for the core debates: EU AI Act, high-risk AI, GPAI, AI liability, global frameworks

## How the AI annotation works

Server functions fetch headlines from [NewsAPI](https://newsapi.org), filter them against a domain allowlist, then call the Anthropic API (Claude Sonnet) to generate practitioner-focused takes and regional summaries. Everything AI-generated is flagged as such in the payload (`takeGenerated` / `summaryGenerated`) and labelled in the UI — if the model call fails, the site falls back to source descriptions rather than silently degrading.

Summaries are cached server-side (24h for geopolitics, 15min for the governance angle) with in-flight request deduplication, so a burst of visitors doesn't trigger a burst of API calls.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing, server functions)
- Vite 8 · Tailwind CSS 4 · shadcn/ui
- TanStack Query for client caching
- NewsAPI + Anthropic API on the server side

## Running locally

```bash
bun install
bun run dev
```

Requires two environment variables:

| Variable | Purpose |
|---|---|
| `NEWSAPI_KEY` | NewsAPI key — free tier works in development only; production requires a paid plan |
| `ANTHROPIC_API_KEY` | Anthropic API key for takes and summaries — optional; the site degrades gracefully without it |

## Design principles

- **No login, no newsletter capture, no clutter.** Just the updates, organised the way I want to read them.
- **AI-generated content is always labelled.** If I expect deployers to be transparent about AI in production, this site should be too.
- **Sources are allowlisted, not open.** Every article link is validated against a fixed domain list before it renders.

## Status

Working prototype. Radar and Themes content is currently hand-curated and updated manually; the news and geopolitics sections are live.
