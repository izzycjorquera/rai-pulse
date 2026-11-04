import { createServerFn } from "@tanstack/react-start";
import { weeklyExpiresAt } from "./cache-schedule";
import { getRedisClient, readArchive, type FeedArticle } from "./news.functions";
import { aggregate, THEMES, type TrackerAggregate } from "./tracker";

const TRACKER_WEEKS = 12;
const MIN_ITEMS_FOR_SYNTHESIS = 5;
const SYNTHESIS_TIMEOUT_MS = 45_000;
const SYNTHESIS_CACHE_KEY = "rai-pulse:tracker-synthesis";

export type SynthesisSection = { text: string; sources: { title: string; url: string }[] };

export type Synthesis = {
  converging: SynthesisSection;
  diverging: SynthesisSection;
  watch: SynthesisSection;
  /** Identifies the archive state this synthesis was generated from. */
  basis: string;
};

export type TrackerPayload = TrackerAggregate & {
  synthesis: Synthesis | null;
  generatedAt: string;
};

const SYNTHESIS_PROMPT =
  'You are a neutral analyst for RAI Pulse, tracking how AI regulation is fragmenting or aligning across jurisdictions, with particular attention to financial services. You are given numbered stories from recent weekly briefings, each tagged with region, country, themes, instrument and regulatory direction. Write three short sections. converging: where jurisdictions are moving in the same direction. diverging: where they are pulling apart. watch: the one or two developments most likely to matter in the next few months. Rules: each section 2-3 sentences; neutral analyst voice; every claim must be supported by the numbered stories, and you must list the numbers you relied on; if the stories do not support a section, say so briefly rather than speculating; no markdown, no em dashes (use a comma, colon, or semicolon instead). Return only minified JSON on one line: {"c":{"t":"text","r":[numbers]},"d":{"t":"text","r":[numbers]},"w":{"t":"text","r":[numbers]}}. No commentary outside the JSON.';

let memo: { payload: Synthesis; expiresAt: number } | null = null;

function synthesisBasis(agg: TrackerAggregate): string {
  return `${agg.weeks[0] ?? "none"}:${agg.weeks.length}:${agg.totalTagged}`;
}

function uniqueTagged(agg: TrackerAggregate): FeedArticle[] {
  const seen = new Set<string>();
  const out: FeedArticle[] = [];
  for (const t of THEMES) {
    for (const a of agg.itemsByTheme[t]) {
      if (seen.has(a.url)) continue;
      seen.add(a.url);
      out.push(a);
    }
  }
  return out;
}

type RawSection = { t?: unknown; r?: unknown };

function toSection(raw: RawSection | undefined, items: FeedArticle[]): SynthesisSection | null {
  if (!raw || typeof raw.t !== "string" || raw.t.trim().length === 0) return null;
  const refs = Array.isArray(raw.r) ? raw.r : [];
  const sources = refs
    .filter((n): n is number => typeof n === "number" && n >= 0 && n < items.length)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .map((n) => ({ title: items[n].title, url: items[n].url }));
  return { text: raw.t.replace(/\*+/g, "").trim(), sources };
}

export function parseSynthesis(
  text: string,
  items: FeedArticle[],
  basis: string,
): Synthesis | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let parsed: { c?: RawSection; d?: RawSection; w?: RawSection };
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const converging = toSection(parsed.c, items);
  const diverging = toSection(parsed.d, items);
  const watch = toSection(parsed.w, items);
  if (!converging || !diverging || !watch) return null;
  return { converging, diverging, watch, basis };
}

async function generateSynthesis(
  apiKey: string,
  items: FeedArticle[],
  basis: string,
): Promise<Synthesis | null> {
  const body = items
    .map(
      (a, i) =>
        `${i}. ${a.title}\n   Source: ${a.source} | Region: ${a.region ?? "?"} | Country: ${a.country ?? "?"} | Themes: ${(a.themes ?? []).join(", ")} | Instrument: ${a.instrument ?? "?"} | Direction: ${a.direction ?? "?"}\n   ${a.enterpriseImplication || a.summary}`,
    )
    .join("\n\n");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SYNTHESIS_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYNTHESIS_PROMPT,
        messages: [{ role: "user", content: `Stories:\n${body}` }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("[tracker] Synthesis HTTP error:", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text =
      json.content
        ?.filter((c) => c.type === "text" && c.text)
        .map((c) => c.text as string)
        .join(" ") ?? "";
    const parsed = parseSynthesis(text, items, basis);
    if (!parsed) console.error("[tracker] Synthesis had no parseable JSON:", text);
    return parsed;
  } catch (err) {
    console.error("[tracker] Synthesis error:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Synthesis is regenerated at most once a week, and only when the archive has
// changed, so visitors never trigger repeated model calls.
async function getSynthesis(agg: TrackerAggregate): Promise<Synthesis | null> {
  const basis = synthesisBasis(agg);
  const now = Date.now();
  if (memo && memo.expiresAt > now && memo.payload.basis === basis) return memo.payload;

  const redis = getRedisClient();
  if (redis) {
    try {
      const stored = await redis.get<{ payload: Synthesis; expiresAt: number }>(
        SYNTHESIS_CACHE_KEY,
      );
      if (stored && stored.expiresAt > now && stored.payload.basis === basis) {
        memo = stored;
        return stored.payload;
      }
    } catch (err) {
      console.error("[tracker] Failed to read synthesis cache:", err);
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || agg.totalTagged < MIN_ITEMS_FOR_SYNTHESIS) return null;
  const payload = await generateSynthesis(apiKey, uniqueTagged(agg), basis);
  if (!payload) return null;
  memo = { payload, expiresAt: weeklyExpiresAt() };
  if (redis) {
    try {
      await redis.set(SYNTHESIS_CACHE_KEY, memo);
    } catch (err) {
      console.error("[tracker] Failed to save synthesis cache:", err);
    }
  }
  return payload;
}

let inflight: Promise<TrackerPayload> | null = null;

export const getTracker = createServerFn({ method: "GET" }).handler(
  async (): Promise<TrackerPayload> => {
    if (inflight) return inflight;
    inflight = (async () => {
      const weeks = await readArchive(TRACKER_WEEKS);
      const agg = aggregate(weeks);
      const synthesis = await getSynthesis(agg);
      return { ...agg, synthesis, generatedAt: new Date().toISOString() };
    })().finally(() => {
      inflight = null;
    });
    return inflight;
  },
);
