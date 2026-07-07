import { createServerFn } from "@tanstack/react-start";
import { weeklyExpiresAt } from "./cache-schedule";

export type RegionHeadline = { title: string; url: string; source: string };

export type RegionSummary = {
  code: "NA" | "EU" | "AP" | "RW";
  region: string;
  summary: string;
  summaryGenerated: boolean;
  headlines: RegionHeadline[];
  error: string | null;
};

export type GeopoliticsPayload = {
  regions: RegionSummary[];
  globalBrief: string | null;
  updatedAt: string;
};

type NewsApiResponse = {
  status: string;
  articles?: Array<{
    title: string | null;
    description: string | null;
    url: string;
    publishedAt: string;
    source: { name: string | null };
  }>;
  message?: string;
};

const REGIONS: {
  code: RegionSummary["code"];
  region: string;
  query: string;
}[] = [
  {
    code: "NA",
    region: "North America",
    query:
      '("White House" OR "United States" OR Washington OR Pentagon OR Canada) AND ("artificial intelligence" OR "AI strategy" OR "AI policy" OR "chip export" OR "export controls" OR semiconductors)',
  },
  {
    code: "EU",
    region: "Europe",
    query:
      '("European Commission" OR "European Union" OR Brussels OR "United Kingdom" OR Britain OR Germany OR France OR Netherlands) AND ("artificial intelligence" OR "AI strategy" OR "AI sovereignty" OR "AI chips" OR semiconductors OR "export controls")',
  },
  {
    code: "AP",
    region: "Asia-Pacific",
    query:
      '(China OR Chinese OR Japan OR "South Korea" OR India OR Taiwan OR Singapore OR Australia) AND ("artificial intelligence" OR "AI strategy" OR "AI chips" OR semiconductors OR "export controls")',
  },
  {
    code: "RW",
    region: "Rest of World",
    query:
      '("Saudi Arabia" OR UAE OR "United Arab Emirates" OR Brazil OR "United Nations" OR Africa OR Israel OR Turkey) AND ("artificial intelligence" OR "AI strategy" OR "sovereign AI" OR "AI chips")',
  },
];

const DOMAINS =
  "reuters.com,ft.com,politico.eu,politico.com,theguardian.com,scmp.com,bloomberg.com,apnews.com,cnbc.com,euractiv.com,euronews.com,bbc.co.uk,dw.com,nikkei.com";

const SYSTEM_PROMPT =
  "You are a geopolitics analyst covering AI. Focus strictly on geopolitics and strategy: national AI strategy, sovereign compute, chip and semiconductor policy, export controls, international competition and cross-border deals. EXCLUDE stories about specific laws or regulations (those belong to a separate regulation section) and stories about individual company product launches or corporate deployments (those belong to a separate company section). You must only make claims supported by the provided articles. Never add analysis from your own background knowledge — everything you write must be traceable to the provided articles.\n\nReturn ONLY a JSON object with this exact shape: {\"summary\": string, \"relevantIndexes\": number[]}. \"relevantIndexes\" lists the 0-based indexes of the numbered input headlines that are genuinely about AI geopolitics/strategy for this region (national AI strategy, sovereign compute, chips, export controls, international competition). Exclude headlines that are off-topic, about specific laws/regulations, or about individual company product news.\n\nIf no input headlines qualify, set \"summary\" to exactly \"No significant developments in this region this week.\" and \"relevantIndexes\" to []. Otherwise \"summary\" is 2-3 sentences (max 3 sentences, roughly 60 words — a hard limit) on this region's current AI strategic positioning, drawn only from the qualifying headlines. Plain text only, no markdown, no asterisks, no bold. Be neutral and factual. Write for a reader who cannot see your source articles. Never refer to 'the headlines', 'the coverage', 'the articles provided' or comment on what the sources do or don't contain. No commentary outside the JSON object.";

const NO_DEVELOPMENTS = "No significant developments in this region this week.";
const META_COMMENTARY = /none of (these|the) headlines|not relevant to this region|no relevant|don'?t contain|do not contain|articles provided|the coverage|the headlines|cannot summari|can'?t summari|unable to summari/i;

const GLOBAL_SYSTEM_PROMPT =
  "You are a geopolitics analyst. Synthesise these four regional AI briefings into one global overview of the week — AI strategy, sovereign compute, chips, export controls, international competition. Maximum 4 sentences, 90 words. Plain text, no markdown. Write for a reader who cannot see the regional briefings.";

const NEWS_TIMEOUT_MS = 4_000;
const SUMMARY_TIMEOUT_MS = 8_000;
let cache: { payload: GeopoliticsPayload; expiresAt: number } | null = null;
let inflight: Promise<GeopoliticsPayload> | null = null;

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isAllowedUrl(u: string): boolean {
  const allowed = DOMAINS.split(",");
  try {
    const h = new URL(u).hostname.replace(/^www\./, "");
    return allowed.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

async function fetchRegionHeadlines(
  newsKey: string,
  query: string,
): Promise<{
  headlines: RegionHeadline[];
  descriptions: string[];
  error: string | null;
}> {
  const q = encodeURIComponent(query);
  const from = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=relevancy&pageSize=25&from=${from}&domains=${DOMAINS}`;
  try {
    const res = await fetchWithTimeout(
      url,
      {
        headers: { "X-Api-Key": newsKey, "User-Agent": "RAI-Pulse/1.0" },
      },
      NEWS_TIMEOUT_MS,
    );
    const json = (await res.json()) as NewsApiResponse;
    if (!res.ok || json.status !== "ok" || !json.articles) {
      return {
        headlines: [],
        descriptions: [],
        error: json.message ?? `HTTP ${res.status}`,
      };
    }
    const filtered = json.articles
      .filter((a) => a.title && a.url && isAllowedUrl(a.url))
      .slice(0, 10);
    return {
      headlines: filtered.map((a) => ({
        title: a.title as string,
        url: a.url,
        source: a.source.name ?? "Unknown",
      })),
      descriptions: filtered.map((a) => a.description ?? ""),
      error: null,
    };
  } catch (e) {
    return {
      headlines: [],
      descriptions: [],
      error: e instanceof Error ? e.message : "Failed to fetch news",
    };
  }
}

async function generateSummary(
  apiKey: string,
  region: string,
  headlines: RegionHeadline[],
  descriptions: string[],
): Promise<{ summary: string; relevantIndexes: number[] | null } | null> {
  const body = headlines
    .map((h, i) => `${i}. ${h.title}\n   ${descriptions[i] ?? ""}`.trim())
    .join("\n");
  try {
    const res = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Region: ${region}\n\nRecent headlines:\n${body}`,
            },
          ],
        }),
      },
      SUMMARY_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const raw = json.content
      ?.filter((c) => c.type === "text" && c.text)
      .map((c) => c.text as string)
      .join(" ")
      .trim();
    if (!raw) return null;
    // Strip markdown fences and isolate the JSON object.
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/g, "")
      .trim();
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as {
          summary?: unknown;
          relevantIndexes?: unknown;
        };
        const rawSummary =
          typeof parsed.summary === "string"
            ? parsed.summary.replace(/\*+/g, "").trim()
            : "";
        const indexes = Array.isArray(parsed.relevantIndexes)
          ? parsed.relevantIndexes
              .filter((n): n is number => typeof n === "number" && Number.isInteger(n))
              .filter((n) => n >= 0 && n < headlines.length)
          : null;
        if (rawSummary) {
          const summary = META_COMMENTARY.test(rawSummary)
            ? NO_DEVELOPMENTS
            : rawSummary;
          const finalIndexes = summary === NO_DEVELOPMENTS ? [] : indexes;
          return { summary, relevantIndexes: finalIndexes };
        }
      } catch {
        // fall through to plain-text fallback
      }
    }
    // Fallback: treat the response as plain text (previous behavior).
    const text = raw.replace(/\*+/g, "").trim();
    if (!text) return null;
    if (META_COMMENTARY.test(text)) {
      return { summary: NO_DEVELOPMENTS, relevantIndexes: [] };
    }
    return { summary: text, relevantIndexes: null };
  } catch {
    return null;
  }
}

async function generateGlobalBrief(
  apiKey: string,
  regions: RegionSummary[],
): Promise<string | null> {
  const body = regions
    .filter((r) => r.summaryGenerated && r.summary)
    .map((r) => `${r.region}: ${r.summary}`)
    .join("\n\n");
  if (!body) return null;
  try {
    const res = await fetchWithTimeout(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 200,
          system: GLOBAL_SYSTEM_PROMPT,
          messages: [{ role: "user", content: body }],
        }),
      },
      SUMMARY_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = json.content
      ?.filter((c) => c.type === "text" && c.text)
      .map((c) => c.text as string)
      .join(" ")
      .replace(/\*+/g, "")
      .trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function buildFallbackSummary(
  region: string,
  headlines: RegionHeadline[],
): string {
  if (headlines.length === 0) return "Update unavailable";
  const sources = Array.from(new Set(headlines.map((h) => h.source))).slice(0, 2);
  return `${region} has recent AI policy signals across ${sources.join(
    " and ",
  )}. Review the source headlines below for the latest direction of travel while the AI-generated regional summary is unavailable.`;
}

async function buildPayload(): Promise<GeopoliticsPayload> {
  const newsKey = process.env.NEWSAPI_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!newsKey) {
    return {
      regions: REGIONS.map(({ code, region }) => ({
        code,
        region,
        summary: "Update unavailable",
        summaryGenerated: false,
        headlines: [],
        error: "Missing NEWSAPI_KEY",
      })),
      globalBrief: null,
      updatedAt: new Date().toISOString(),
    };
  }

  // 1. Fetch all regions in parallel
  const raw = await Promise.all(
    REGIONS.map(({ query }) => fetchRegionHeadlines(newsKey, query)),
  );

  // 2. Deduplicate URLs across regions — keep each URL in the region where it
  //    ranks highest (smallest index in fetched list); on ties, first region.
  const bestRegionFor = new Map<string, { regionIdx: number; itemIdx: number }>();
  raw.forEach((r, regionIdx) => {
    r.headlines.forEach((h, itemIdx) => {
      const cur = bestRegionFor.get(h.url);
      if (
        !cur ||
        itemIdx < cur.itemIdx ||
        (itemIdx === cur.itemIdx && regionIdx < cur.regionIdx)
      ) {
        bestRegionFor.set(h.url, { regionIdx, itemIdx });
      }
    });
  });

  const deduped = raw.map((r, regionIdx) => {
    const kept: { headlines: RegionHeadline[]; descriptions: string[] } = {
      headlines: [],
      descriptions: [],
    };
    r.headlines.forEach((h, i) => {
      if (bestRegionFor.get(h.url)?.regionIdx === regionIdx) {
        kept.headlines.push(h);
        kept.descriptions.push(r.descriptions[i] ?? "");
      }
    });
    return {
      headlines: kept.headlines.slice(0, 3),
      descriptions: kept.descriptions.slice(0, 3),
      error: r.error,
    };
  });

  // 3. Summarise each region in parallel from its deduped set
  const regions = await Promise.all(
    REGIONS.map(async ({ code, region }, i): Promise<RegionSummary> => {
      const { headlines, descriptions, error } = deduped[i];
      if (error || headlines.length === 0) {
        return {
          code,
          region,
          summary: "Update unavailable",
          summaryGenerated: false,
          headlines,
          error: error ?? "No recent headlines",
        };
      }
      const result = anthropicKey
        ? await generateSummary(anthropicKey, region, headlines, descriptions)
        : null;
      if (!result) {
        return {
          code,
          region,
          summary: buildFallbackSummary(region, headlines),
          summaryGenerated: false,
          headlines,
          error: "AI summary unavailable",
        };
      }
      // Filter headlines to those Claude flagged as relevant. If it didn't
      // return a valid list, fall back to showing all headlines.
      const filteredHeadlines =
        result.relevantIndexes === null
          ? headlines
          : result.relevantIndexes.map((i) => headlines[i]).filter(Boolean);
      const displayHeadlines =
        result.summary === NO_DEVELOPMENTS ? [] : filteredHeadlines;
      return {
        code,
        region,
        summary: result.summary,
        summaryGenerated: true,
        headlines: displayHeadlines,
        error: null,
      };
    }),
  );

  const globalBrief = anthropicKey
    ? await generateGlobalBrief(anthropicKey, regions)
    : null;

  return { regions, globalBrief, updatedAt: new Date().toISOString() };
}

export const getGeopolitics = createServerFn({ method: "GET" }).handler(
  async (): Promise<GeopoliticsPayload> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.payload;
    if (inflight) return inflight;
    inflight = buildPayload()
      .then((payload) => {
        cache = { payload, expiresAt: weeklyExpiresAt() };
        return payload;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
);