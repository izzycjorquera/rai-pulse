import { createServerFn } from "@tanstack/react-start";

export type RegionHeadline = { title: string; url: string; source: string };

export type RegionSummary = {
  code: "US" | "EU" | "UK" | "CN";
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
    code: "US",
    region: "United States",
    query:
      '(AI OR "artificial intelligence") AND (US OR "United States" OR "White House" OR Congress OR Biden OR Trump) AND (regulation OR policy OR bill OR executive OR law)',
  },
  {
    code: "EU",
    region: "European Union",
    query:
      '"AI Act" OR ("artificial intelligence" AND (Brussels OR "European Commission" OR EU OR "AI Office"))',
  },
  {
    code: "UK",
    region: "United Kingdom",
    query:
      '(AI OR "artificial intelligence") AND (UK OR Britain OR "United Kingdom" OR AISI) AND (regulation OR policy OR government OR bill)',
  },
  {
    code: "CN",
    region: "China",
    query:
      '(AI OR "artificial intelligence") AND (China OR Chinese OR Beijing OR CAC) AND (regulation OR rules OR policy OR law)',
  },
];

const DOMAINS =
  "reuters.com,ft.com,politico.eu,politico.com,theguardian.com,scmp.com";

const SYSTEM_PROMPT =
  "You are an AI policy analyst. Based on these recent headlines, write 2-3 sentences summarising how this jurisdiction is currently positioning itself on AI regulation. Focus on direction of travel, not individual news items. Be neutral and factual. If the headlines don't contain enough signal, say 'No significant developments this week' rather than speculating.";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cache: { payload: GeopoliticsPayload; expiresAt: number } | null = null;
let inflight: Promise<GeopoliticsPayload> | null = null;

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
    const res = await fetch(url, {
      headers: { "X-Api-Key": newsKey, "User-Agent": "RAI-Pulse/1.0" },
    });
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
      .slice(0, 3);
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
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 350,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Region: ${region}\n\nRecent headlines:\n${body}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = json.content
      ?.filter((c) => c.type === "text" && c.text)
      .map((c) => c.text as string)
      .join(" ")
      .trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

async function buildPayload(): Promise<GeopoliticsPayload> {
  const newsKey = process.env.NEWSAPI_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const regions = await Promise.all(
    REGIONS.map(async ({ code, region, query }): Promise<RegionSummary> => {
      if (!newsKey) {
        return {
          code,
          region,
          summary: "Update unavailable",
          summaryGenerated: false,
          headlines: [],
          error: "Missing NEWSAPI_KEY",
        };
      }
      const { headlines, descriptions, error } = await fetchRegionHeadlines(
        newsKey,
        query,
      );
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
        summary: summary || "Update unavailable",
        summaryGenerated: Boolean(summary),
        headlines,
        error: summary ? null : "Anthropic call failed",
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