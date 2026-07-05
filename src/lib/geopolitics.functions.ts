import { createServerFn } from "@tanstack/react-start";

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
      '"White House artificial intelligence" OR "US AI policy" OR "American AI" OR "Canada artificial intelligence" OR "US chip export"',
  },
  {
    code: "EU",
    region: "Europe",
    query:
      '"European Commission AI" OR "EU AI Act" OR "Brussels artificial intelligence" OR "UK artificial intelligence"',
  },
  {
    code: "AP",
    region: "Asia-Pacific",
    query:
      '"China artificial intelligence" OR "Chinese AI" OR "Japan AI" OR "South Korea artificial intelligence" OR "India AI" OR "Taiwan chips"',
  },
  {
    code: "RW",
    region: "Rest of World",
    query:
      '"Saudi Arabia artificial intelligence" OR "UAE AI" OR "India AI" OR "Brazil AI" OR "United Nations AI" OR "Africa artificial intelligence"',
  },
];

const DOMAINS =
  "reuters.com,ft.com,politico.eu,politico.com,theguardian.com,scmp.com,bloomberg.com,apnews.com,cnbc.com";

const SYSTEM_PROMPT =
  "You are a geopolitics analyst covering AI. Based on these recent headlines, write 2-3 sentences on this region's current AI positioning — national strategy, investment, chip policy, export controls, major deals or regulation. Maximum 3 sentences, roughly 60 words. This is a hard limit. Plain text only, no markdown, no asterisks, no bold. Ignore any headline that is not actually about this region; the search matches loosely, so you are the relevance filter. If the headlines cover multiple countries in the region, capture the overall regional picture. Be neutral and factual. Write for a reader who cannot see your source articles. Never refer to 'the headlines', 'the coverage', 'the articles provided' or comment on what the sources do or don't contain. Brief the reader directly on the region's AI positioning based on what the articles report. If the articles contain only weak or tangential signal for this region, write one short factual sentence about what is happening rather than explaining why you can't summarise — for example 'Recent developments centre on X' — and nothing more.";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
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
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=25&domains=${DOMAINS}`;
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
): Promise<string | null> {
  const body = headlines
    .map((h, i) => `- ${h.title}\n  ${descriptions[i] ?? ""}`.trim())
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
          max_tokens: 120,
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
      const summary =
        anthropicKey &&
        (await generateSummary(anthropicKey, region, headlines, descriptions));
      return {
        code,
        region,
        summary: summary || buildFallbackSummary(region, headlines),
        summaryGenerated: Boolean(summary),
        headlines,
        error: summary ? null : "AI summary unavailable",
      };
    }),
  );

  return { regions, updatedAt: new Date().toISOString() };
}

export const getGeopolitics = createServerFn({ method: "GET" }).handler(
  async (): Promise<GeopoliticsPayload> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.payload;
    if (inflight) return inflight;
    inflight = buildPayload()
      .then((payload) => {
        cache = { payload, expiresAt: Date.now() + CACHE_TTL_MS };
        return payload;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
);