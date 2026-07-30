# RAI Pulse

A personal, curated briefing on AI governance — regulation, standards, enforcement and the occasional paper worth reading twice. Built to keep the signal separate from the noise, and, honestly, to prove I could build it.

**Live sections:**

- **This week** — the 12 most significant AI governance stories of the week, drawn from a fixed allowlist of quality sources (Reuters, FT, Politico, BBC, MIT Tech Review and others), each tagged with region, country and topic and annotated with a one-sentence, AI-generated enterprise implication, plus a synthesized intro paragraph
- **Geopolitics map** — the same week's stories plotted on a four-region map (North America, Europe, Asia-Pacific, Rest of World), grouped by country
- **Radar** — upcoming deadlines, open consultations and enforcement signals
- **Read of the week** — one paper, book or podcast worth your time, with a short digest

## How the AI annotation works

A server function fetches headlines from [NewsAPI](https://newsapi.org), filters them against a domain allowlist, then calls the Anthropic API (Claude Sonnet) once to select and rank the week's 12 stories, tag each with a region/country/topic and a one-sentence enterprise implication, and once more to write the week's intro paragraph. If either model call fails, or NewsAPI/an API key is unavailable, the site returns a "briefing temporarily unavailable" message rather than showing stale or fabricated content.

The result is cached server-side for 24h, with in-flight request deduplication so a burst of visitors doesn't trigger a burst of API calls — and a short 5-minute cache on failures, so an upstream outage doesn't turn every visitor into a fresh retry.

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

| Variable            | Purpose                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `NEWSAPI_KEY`       | NewsAPI key — free tier works in development only; production requires a paid plan            |
| `ANTHROPIC_API_KEY` | Anthropic API key for takes and summaries — optional; the site degrades gracefully without it |

## Design principles

- **No login, no newsletter capture, no clutter.** Just the updates, organised the way I want to read them.
- **AI-generated content is always labelled.** If I expect deployers to be transparent about AI in production, this site should be too.
- **Sources are allowlisted, not open.** Every article link is validated against a fixed domain list before it renders.

## Status

Working prototype. Radar and Read of the week content is currently hand-curated and updated manually; the weekly briefing and geopolitics map are live and AI-annotated.
