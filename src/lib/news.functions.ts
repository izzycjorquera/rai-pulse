import { createServerFn } from "@tanstack/react-start";

export type FeedArticle = {
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
  region?: "North America" | "Europe" | "Asia-Pacific" | "Rest of World";
};

export type RegionCode = "NA" | "EU" | "AP" | "RW";

export type RegionalSection = {
  code: RegionCode;
  region: "North America" | "Europe" | "Asia-Pacific" | "Rest of World";
  summary: string;
  summaryGenerated: boolean;
  articles: FeedArticle[];
};

export type FeedPayload = {
  articles: FeedArticle[];
  regions: RegionalSection[];
  updatedAt: string;
  error: string | null;
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

function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const day = 86_400_000;
  const d = Math.floor(diff / day);
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w === 1) return "1 week ago";
  if (w < 5) return `${w} weeks ago`;
  const m = Math.floor(d / 30);
  return m <= 1 ? "1 month ago" : `${m} months ago`;
}

const CURATION_PROMPT =
  'You are the editor of RAI Pulse, a weekly AI governance briefing for enterprise readers. From these headlines, select the 12 most relevant to AI governance, regulation, or AI geopolitics. Discard product launches, stock news, and opinion pieces.\n\nAssign each selected article to exactly one of these four regions, using these exact strings:\n\nNorth America — stories about the US (federal or state level, e.g. California, Colorado), Canada, or Mexico.\n\nEurope — stories about the EU, any EU member state, the UK, Switzerland, Norway, or the Council of Europe.\n\nAsia-Pacific — stories about China, Japan, South Korea, India, Singapore, Australia, New Zealand, or ASEAN countries.\n\nRest of World — everything else: Middle East, Africa, Latin America (excluding Mexico), and genuinely global/multilateral stories (UN, OECD, G7, international treaties).\n\nIf a story spans multiple regions (e.g. a US–EU agreement), assign it to the region where the regulatory action originates. Return the region string exactly as written — no variations like \'US\', \'NA\', or \'APAC\'.\n\nReturn only valid JSON: an array of objects with fields "index" (integer, referring to the numbered headline), "region" (one of North America, Europe, Asia-Pacific, Rest of World), and "reason" (one short sentence explaining why it was selected, roughly 25 words maximum). No commentary outside the JSON.';

const REGION_SUMMARY_PROMPT =
  "You are a neutral analyst writing for RAI Pulse, a weekly briefing on AI governance for enterprise readers. Given the numbered articles for one region, write a short summary of the week in that region for AI governance, regulation and AI geopolitics. Rules: 2-3 sentences of neutral analyst voice, no opinion, no markdown, no asterisks, no bold. Every claim must be supported by the provided articles — never add analysis from your own background knowledge. End with exactly one final sentence that begins with 'For enterprises:' spelling out one concrete implication for large enterprises. Do not refer to 'the articles', 'the headlines' or 'the coverage'. Return plain text only, no JSON, no preamble.";

const REGION_ORDER: {
  code: RegionCode;
  region: RegionalSection["region"];
}[] = [
  { code: "NA", region: "North America" },
  { code: "EU", region: "Europe" },
  { code: "AP", region: "Asia-Pacific" },
  { code: "RW", region: "Rest of World" },
];

const NO_DEVELOPMENTS =
  "No significant developments in this region this week.";
const BRIEFING_UNAVAILABLE = "Briefing temporarily unavailable.";

const NEWS_TIMEOUT_MS = 6_000;
const CURATION_TIMEOUT_MS = 12_000;
const SUMMARY_TIMEOUT_MS = 10_000;
const DAY_MS = 24 * 60 * 60 * 1_000;
let cache: { payload: FeedPayload; expiresAt: number } | null = null;
let inflight: Promise<FeedPayload> | null = null;

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

type Candidate = {
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
};

async function curateWithClaude(
  apiKey: string,
  candidates: Candidate[],
): Promise<
  { index: number; region: FeedArticle["region"]; reason: string }[] | null
> {
  const list = candidates
    .map(
      (c, i) =>
        `${i}. ${c.title}\n   Source: ${c.source}\n   ${c.summary}`,
    )
    .join("\n\n");
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
          max_tokens: 800,
          system: CURATION_PROMPT,
          messages: [{ role: "user", content: list }],
        }),
      },
      CURATION_TIMEOUT_MS,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      json.content
        ?.filter((c) => c.type === "text" && c.text)
        .map((c) => c.text as string)
        .join(" ")
        .trim() ?? "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Array<{
      index: number;
      region?: string;
      reason?: string;
      why?: string;
    }>;
    if (!Array.isArray(parsed)) return null;
    const allowedRegions = [
      "North America",
      "Europe",
      "Asia-Pacific",
      "Rest of World",
    ] as const;
    return parsed
      .filter(
        (p) =>
          typeof p.index === "number" &&
          p.index >= 0 &&
          p.index < candidates.length,
      )
      .map((p) => {
        const region =
          allowedRegions.find((r) => r === p.region) ?? "Rest of World";
        const reason = (p.reason ?? p.why ?? "").toString();
        return { index: p.index, region, reason };
      })
      .slice(0, 12);
  } catch {
    return null;
  }
}

async function generateRegionSummary(
  apiKey: string,
  region: RegionalSection["region"],
  articles: FeedArticle[],
): Promise<string | null> {
  const body = articles
    .map((a, i) => `${i}. ${a.title}\n   Source: ${a.source}\n   ${a.summary}`)
    .join("\n\n");
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
          system: REGION_SUMMARY_PROMPT,
          messages: [
            {
              role: "user",
              content: `Region: ${region}\n\nArticles:\n${body}`,
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

async function buildPayload(): Promise<FeedPayload> {
  const key = process.env.NEWSAPI_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      articles: [],
      regions: REGION_ORDER.map(({ code, region }) => ({
        code,
        region,
        summary: BRIEFING_UNAVAILABLE,
        summaryGenerated: false,
        articles: [],
      })),
      updatedAt: new Date().toISOString(),
      error: "Missing NEWSAPI_KEY",
    };
  }

    // Stage 1: broad fetch. Keep the query intentionally wide — Claude filters.
    const q = encodeURIComponent(
      '(AI OR "artificial intelligence") AND (regulation OR governance OR policy OR regulator OR lawmakers OR "export controls" OR compliance OR oversight)',
    );
    const domains =
      "bbc.co.uk,reuters.com,ft.com,politico.eu,politico.com,theverge.com,wired.com,technologyreview.com,theguardian.com,apnews.com,euractiv.com,euronews.com,dw.com,scmp.com,techcrunch.com,axios.com";
    const from = new Date(Date.now() - 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=relevancy&pageSize=30&from=${from}&domains=${domains}`;

    const allowedDomains = domains.split(",");
    const isAllowedUrl = (articleUrl: string) => {
      try {
        const host = new URL(articleUrl).hostname.replace(/^www\./, "");
        return allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
      } catch {
        return false;
      }
    };

    try {
      const res = await fetchWithTimeout(
        url,
        { headers: { "X-Api-Key": key, "User-Agent": "RAI-Pulse/1.0" } },
        NEWS_TIMEOUT_MS,
      );
      const json = (await res.json()) as NewsApiResponse;
      if (!res.ok || json.status !== "ok" || !json.articles) {
        return {
          articles: [],
          regions: REGION_ORDER.map(({ code, region }) => ({
            code,
            region,
            summary: BRIEFING_UNAVAILABLE,
            summaryGenerated: false,
            articles: [],
          })),
          updatedAt: new Date().toISOString(),
          error: json.message ?? `HTTP ${res.status}`,
        };
      }
      // Deduplicate by URL before anything else.
      const seen = new Set<string>();
      const candidates: Candidate[] = json.articles
        .filter((a) => {
          if (!a.title || !a.description || !a.url) return false;
          if (!isAllowedUrl(a.url)) return false;
          if (seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
        })
        .slice(0, 30)
        .map((a) => ({
          title: a.title as string,
          source: a.source.name ?? "Unknown",
          date: relativeDate(a.publishedAt),
          summary: a.description as string,
          url: a.url,
        }));
      console.log("[news] candidates after filter:", candidates.length);

      if (candidates.length === 0) {
        return {
          articles: [],
          regions: REGION_ORDER.map(({ code, region }) => ({
            code,
            region,
            summary: BRIEFING_UNAVAILABLE,
            summaryGenerated: false,
            articles: [],
          })),
          updatedAt: new Date().toISOString(),
          error: "No candidates after filter",
        };
      }

      let articles: FeedArticle[];
      if (anthropicKey && candidates.length > 0) {
        const picks = await curateWithClaude(anthropicKey, candidates);
        if (picks && picks.length > 0) {
          console.log(
            `[news] Claude selected ${picks.length} articles:`,
            picks.map((p) => ({
              region: p.region,
              title: candidates[p.index]?.title,
            })),
          );
          articles = picks.map((p) => ({
            ...candidates[p.index],
            summary: p.reason.trim() || candidates[p.index].summary,
            region: p.region,
          }));
        } else {
          articles = candidates.slice(0, 12);
        }
      } else {
        articles = candidates.slice(0, 12);
      }

      // Group articles by region and generate one summary per region in parallel.
      const regions: RegionalSection[] = await Promise.all(
        REGION_ORDER.map(async ({ code, region }) => {
          const regionArticles = articles.filter((a) => a.region === region);
          if (regionArticles.length === 0 || !anthropicKey) {
            return {
              code,
              region,
              summary:
                regionArticles.length === 0
                  ? NO_DEVELOPMENTS
                  : "Regional summary unavailable this week.",
              summaryGenerated: false,
              articles: regionArticles,
            };
          }
          const summary = await generateRegionSummary(
            anthropicKey,
            region,
            regionArticles,
          );
          return {
            code,
            region,
            summary: summary ?? "Regional summary unavailable this week.",
            summaryGenerated: summary != null,
            articles: regionArticles,
          };
        }),
      );

      return {
        articles,
        regions,
        updatedAt: new Date().toISOString(),
        error: null,
      };
    } catch (e) {
      return {
        articles: [],
        regions: REGION_ORDER.map(({ code, region }) => ({
          code,
          region,
          summary: BRIEFING_UNAVAILABLE,
          summaryGenerated: false,
          articles: [],
        })),
        updatedAt: new Date().toISOString(),
        error: e instanceof Error ? e.message : "Failed to fetch news",
      };
    }
}

export const getRegulatoryFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedPayload> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.payload;
    if (inflight) return inflight;
    inflight = buildPayload()
      .then((payload) => {
        if (payload.error === null || payload.articles.length > 0) {
          cache = { payload, expiresAt: Date.now() + DAY_MS };
        }
        return payload;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
);