import { createServerFn } from "@tanstack/react-start";
import { weeklyExpiresAt } from "./cache-schedule";

export type FeedArticle = {
  title: string;
  source: string;
  date: string;
  summary: string;
  enterpriseImplication: string;
  url: string;
  region?: "North America" | "Europe" | "Asia-Pacific" | "Rest of World";
  country?: string;
  lat?: number;
  lon?: number;
  imageUrl?: string;
  topic?: string;
};

export type FeedPayload = {
  articles: FeedArticle[];
  intro: string | null;
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
    urlToImage?: string | null;
  }>;
  message?: string;
};

export function relativeDate(iso: string): string {
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
  'You are the editor of RAI Pulse, a weekly AI governance briefing for enterprise readers. From these headlines, select the 12 most significant stories of the week for responsible AI, ranked by significance for enterprise readers (most significant first). Discard product launches, stock news, and opinion pieces.\n\nFor each selected story, assign a region code using exactly one of these strings:\n\nNA — stories about the US (federal or state level, e.g. California, Colorado), Canada, or Mexico.\n\nEU — stories about the EU, any EU member state, the UK, Switzerland, Norway, or the Council of Europe.\n\nAP — stories about China, Japan, South Korea, India, Singapore, Australia, New Zealand, or ASEAN countries.\n\nRW — everything else: Middle East, Africa, Latin America (excluding Mexico), and genuinely global/multilateral stories (UN, OECD, G7, international treaties).\n\nIf a story spans multiple regions, assign it to the region where the regulatory action originates.\n\nAlso pick the single most relevant country as a "c" field: use the country\'s common English name (e.g. "United States", "United Kingdom", "China"), or the exact string "EU" for EU-wide stories not tied to one member state, or "Global" for genuinely multilateral stories with no single locus.\n\nAssign each story exactly one topic tag from this list, choosing the most specific fit: Regulation & Enforcement · Safety & Testing · Chips & Export Controls · Litigation & Liability · Labor & Workforce · Privacy & Data · National AI Strategy · Standards & Frameworks · Defense & Security · Corporate Accountability. Aim for topical variety across the 12 selections — if two stories tell the same story, prefer the more significant one and pick something different for the other slot.\n\nFor each story, write two short sentences read as one flowing takeaway — never label or separate them as distinct parts. The first sentence states the key development in plain terms: what was actually decided, proposed, or found. The second sentence carries the concrete business implication for enterprise responsible-AI practitioners, beginning with the affected actor — e.g. "Compliance teams...", "Fleet operators...", "Multinationals with EU operations...", "Procurement leads..." — and never using a stock prefix like "For enterprises:" or "Why it matters:". Vary the actor openings across the selection. Keep the whole thing tight: two short sentences, 45 words maximum total. Do not use em dashes in the takeaway text; use a comma, colon, or semicolon instead.\n\nReturn only valid JSON: an array of objects, ordered by significance (most significant first), with these exact short-key fields per object: "i" (integer, referring to the numbered headline), "r" (region code, one of "NA", "EU", "AP", "RW"), "c" (country string), "t" (topic tag), and "m" (the two-sentence takeaway). Return the JSON minified on a single line — no line breaks or indentation. No commentary outside the JSON.';

const INTRO_PROMPT =
  "You are a neutral analyst writing for RAI Pulse, a weekly briefing on AI governance for enterprise readers. Given the numbered stories selected for this week, write a short intro paragraph synthesizing the overall picture of the week. Rules: 2-3 sentences, neutral analyst voice, no opinion, no markdown, no asterisks, no bold, no bullet points, no em dashes (use a comma, colon, or semicolon instead). Every claim must be supported by the provided stories. Do not refer to 'the articles', 'the headlines', 'the stories' or 'the coverage'. Return plain text only, no JSON, no preamble.";

const BRIEFING_UNAVAILABLE = "Briefing temporarily unavailable.";

const NEWS_TIMEOUT_MS = 6_000;
const CURATION_TIMEOUT_MS = 90_000;
const INTRO_TIMEOUT_MS = 20_000;
const ERROR_CACHE_MS = 5 * 60 * 1_000;

const DEBUG = process.env.NEWS_DEBUG === "true";
function debugLog(...args: unknown[]) {
  if (DEBUG) console.log(...args);
}
const REGION_BY_CODE: Record<string, FeedArticle["region"]> = {
  NA: "North America",
  EU: "Europe",
  AP: "Asia-Pacific",
  RW: "Rest of World",
};

// Capital-city coordinates for countries most likely to appear in AI policy news.
// "EU" maps to Brussels. Countries absent from this table simply get no pin.
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  "United States": { lat: 38.9072, lon: -77.0369 },
  Canada: { lat: 45.4215, lon: -75.6972 },
  Mexico: { lat: 19.4326, lon: -99.1332 },
  EU: { lat: 50.8503, lon: 4.3517 },
  "United Kingdom": { lat: 51.5074, lon: -0.1278 },
  Ireland: { lat: 53.3498, lon: -6.2603 },
  France: { lat: 48.8566, lon: 2.3522 },
  Germany: { lat: 52.52, lon: 13.405 },
  Italy: { lat: 41.9028, lon: 12.4964 },
  Spain: { lat: 40.4168, lon: -3.7038 },
  Portugal: { lat: 38.7223, lon: -9.1393 },
  Netherlands: { lat: 52.3676, lon: 4.9041 },
  Belgium: { lat: 50.8503, lon: 4.3517 },
  Luxembourg: { lat: 49.6116, lon: 6.1319 },
  Denmark: { lat: 55.6761, lon: 12.5683 },
  Sweden: { lat: 59.3293, lon: 18.0686 },
  Norway: { lat: 59.9139, lon: 10.7522 },
  Finland: { lat: 60.1699, lon: 24.9384 },
  Iceland: { lat: 64.1466, lon: -21.9426 },
  Switzerland: { lat: 46.948, lon: 7.4474 },
  Austria: { lat: 48.2082, lon: 16.3738 },
  Poland: { lat: 52.2297, lon: 21.0122 },
  Czechia: { lat: 50.0755, lon: 14.4378 },
  "Czech Republic": { lat: 50.0755, lon: 14.4378 },
  Slovakia: { lat: 48.1486, lon: 17.1077 },
  Hungary: { lat: 47.4979, lon: 19.0402 },
  Romania: { lat: 44.4268, lon: 26.1025 },
  Bulgaria: { lat: 42.6977, lon: 23.3219 },
  Greece: { lat: 37.9838, lon: 23.7275 },
  Estonia: { lat: 59.437, lon: 24.7536 },
  Latvia: { lat: 56.9496, lon: 24.1052 },
  Lithuania: { lat: 54.6872, lon: 25.2797 },
  Ukraine: { lat: 50.4501, lon: 30.5234 },
  Russia: { lat: 55.7558, lon: 37.6173 },
  Turkey: { lat: 39.9334, lon: 32.8597 },
  China: { lat: 39.9042, lon: 116.4074 },
  "Hong Kong": { lat: 22.3193, lon: 114.1694 },
  Taiwan: { lat: 25.033, lon: 121.5654 },
  Japan: { lat: 35.6762, lon: 139.6503 },
  "South Korea": { lat: 37.5665, lon: 126.978 },
  "North Korea": { lat: 39.0392, lon: 125.7625 },
  India: { lat: 28.6139, lon: 77.209 },
  Pakistan: { lat: 33.6844, lon: 73.0479 },
  Bangladesh: { lat: 23.8103, lon: 90.4125 },
  Singapore: { lat: 1.3521, lon: 103.8198 },
  Malaysia: { lat: 3.139, lon: 101.6869 },
  Indonesia: { lat: -6.2088, lon: 106.8456 },
  Thailand: { lat: 13.7563, lon: 100.5018 },
  Vietnam: { lat: 21.0285, lon: 105.8542 },
  Philippines: { lat: 14.5995, lon: 120.9842 },
  Australia: { lat: -35.2809, lon: 149.13 },
  "New Zealand": { lat: -41.2865, lon: 174.7762 },
  Israel: { lat: 31.7683, lon: 35.2137 },
  "Saudi Arabia": { lat: 24.7136, lon: 46.6753 },
  "United Arab Emirates": { lat: 24.4539, lon: 54.3773 },
  UAE: { lat: 24.4539, lon: 54.3773 },
  Qatar: { lat: 25.2854, lon: 51.531 },
  Iran: { lat: 35.6892, lon: 51.389 },
  Egypt: { lat: 30.0444, lon: 31.2357 },
  "South Africa": { lat: -25.7479, lon: 28.2293 },
  Nigeria: { lat: 9.0765, lon: 7.3986 },
  Kenya: { lat: -1.2921, lon: 36.8219 },
  Morocco: { lat: 34.0209, lon: -6.8416 },
  Brazil: { lat: -15.7942, lon: -47.8822 },
  Argentina: { lat: -34.6037, lon: -58.3816 },
  Chile: { lat: -33.4489, lon: -70.6693 },
  Colombia: { lat: 4.711, lon: -74.0721 },
};

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
  imageUrl?: string;
};

type CurationPick = {
  i?: number;
  r?: string;
  c?: string;
  t?: string;
  m?: string;
};

// Claude is asked for bare JSON but may wrap it in prose despite the prompt;
// pull out the first top-level array and parse just that.
export function extractJsonArray(text: string): CurationPick[] | null {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  return Array.isArray(parsed) ? (parsed as CurationPick[]) : null;
}

async function curateWithClaude(
  apiKey: string,
  candidates: Candidate[],
): Promise<
  | {
      index: number;
      region: FeedArticle["region"];
      implication: string;
      country?: string;
      lat?: number;
      lon?: number;
      topic?: string;
    }[]
  | null
> {
  const list = candidates
    .map((c, i) => `${i}. ${c.title}\n   Source: ${c.source}\n   ${c.summary}`)
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
          max_tokens: 4000,
          system: CURATION_PROMPT,
          messages: [{ role: "user", content: list }],
        }),
      },
      CURATION_TIMEOUT_MS,
    );
    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[news] Claude curation HTTP error:", res.status, errorBody);
      return null;
    }
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      json.content
        ?.filter((c) => c.type === "text" && c.text)
        .map((c) => c.text as string)
        .join(" ")
        .trim() ?? "";
    debugLog("[news] Claude raw response:", text);
    const parsed = extractJsonArray(text);
    if (!parsed) {
      console.error("[news] Claude response had no parseable JSON array:", text);
      return null;
    }
    return parsed
      .filter((p) => typeof p.i === "number" && p.i >= 0 && p.i < candidates.length)
      .map((p) => {
        const region = REGION_BY_CODE[(p.r ?? "").toUpperCase()] ?? "Rest of World";
        const implication = (p.m ?? "").toString().trim();
        const country = typeof p.c === "string" && p.c.trim().length > 0 ? p.c.trim() : undefined;
        const coords = country ? COUNTRY_COORDS[country] : undefined;
        const topic = typeof p.t === "string" && p.t.trim().length > 0 ? p.t.trim() : undefined;
        return {
          index: p.i as number,
          region,
          implication,
          country,
          lat: coords?.lat,
          lon: coords?.lon,
          topic,
        };
      })
      .slice(0, 12);
  } catch (err) {
    console.error("[news] Claude curation error:", err);
    return null;
  }
}

async function generateIntro(apiKey: string, articles: FeedArticle[]): Promise<string | null> {
  const body = articles
    .map((a, i) => `${i}. [${a.region}] ${a.title}\n   Source: ${a.source}\n   ${a.summary}`)
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
          system: INTRO_PROMPT,
          messages: [
            {
              role: "user",
              content: `Stories:\n${body}`,
            },
          ],
        }),
      },
      INTRO_TIMEOUT_MS,
    );
    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[news] Claude intro HTTP error:", res.status, errorBody);
      return null;
    }
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

// Every article link is checked against this allowlist before it renders —
// exported for testing (`isAllowedUrl`) since it's the site's one link-safety gate.
export const ALLOWED_DOMAINS = [
  "bbc.co.uk",
  "reuters.com",
  "ft.com",
  "politico.eu",
  "politico.com",
  "theverge.com",
  "wired.com",
  "technologyreview.com",
  "theguardian.com",
  "apnews.com",
  "euractiv.com",
  "euronews.com",
  "dw.com",
  "scmp.com",
  "techcrunch.com",
  "axios.com",
  "aljazeera.com",
  "restofworld.org",
];

export function isAllowedUrl(
  articleUrl: string,
  allowedDomains: string[] = ALLOWED_DOMAINS,
): boolean {
  try {
    const host = new URL(articleUrl).hostname.replace(/^www\./, "");
    return allowedDomains.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

async function buildPayload(): Promise<FeedPayload> {
  const key = process.env.NEWSAPI_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("[news] Missing NEWSAPI_KEY");
    return {
      articles: [],
      intro: null,
      updatedAt: new Date().toISOString(),
      error: "Missing NEWSAPI_KEY",
    };
  }

  // Stage 1: broad fetch. Keep the query intentionally wide — Claude filters.
  const q = encodeURIComponent(
    '(AI OR "artificial intelligence") AND (regulation OR governance OR policy OR regulator OR lawmakers OR "export controls" OR compliance OR oversight)',
  );
  const domains = ALLOWED_DOMAINS.join(",");
  const from = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=relevancy&pageSize=100&from=${from}&domains=${domains}`;

  // Exclude last week's selected articles from the candidate pool so a story
  // that's still within the 7-day NewsAPI window can't be picked twice in a
  // row. Best-effort only: `cache` is in-memory, so this has no effect if the
  // server process was recycled since the last refresh.
  const previousUrls = new Set((cache?.payload.articles ?? []).map((a) => a.url));

  try {
    const res = await fetchWithTimeout(
      url,
      { headers: { "X-Api-Key": key, "User-Agent": "RAI-Pulse/1.0" } },
      NEWS_TIMEOUT_MS,
    );
    const json = (await res.json()) as NewsApiResponse;
    if (!res.ok || json.status !== "ok" || !json.articles) {
      console.error("[news] NewsAPI HTTP error:", res.status, json.message);
      return {
        articles: [],
        intro: null,
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
        if (previousUrls.has(a.url)) return false;
        seen.add(a.url);
        return true;
      })
      .slice(0, 40)
      .map((a) => ({
        title: a.title as string,
        source: a.source.name ?? "Unknown",
        date: relativeDate(a.publishedAt),
        summary: a.description as string,
        url: a.url,
        imageUrl:
          typeof a.urlToImage === "string" && a.urlToImage.startsWith("http")
            ? a.urlToImage
            : undefined,
      }));
    debugLog("[news] candidates after filter:", candidates.length);

    if (candidates.length === 0) {
      console.error("[news] No candidates after filter");
      return {
        articles: [],
        intro: null,
        updatedAt: new Date().toISOString(),
        error: "No candidates after filter",
      };
    }

    if (!anthropicKey) {
      console.error("[news] Missing ANTHROPIC_API_KEY");
      return {
        articles: [],
        intro: null,
        updatedAt: new Date().toISOString(),
        error: "Missing ANTHROPIC_API_KEY",
      };
    }
    const picks = await curateWithClaude(anthropicKey, candidates);
    if (!picks || picks.length === 0) {
      console.error("[news] Curation failed");
      return {
        articles: [],
        intro: null,
        updatedAt: new Date().toISOString(),
        error: "Curation failed",
      };
    }
    debugLog(
      `[news] Claude selected ${picks.length} articles:`,
      picks.map((p) => ({
        region: p.region,
        title: candidates[p.index]?.title,
      })),
    );
    const articles: FeedArticle[] = picks.map((p) => ({
      ...candidates[p.index],
      enterpriseImplication: p.implication,
      region: p.region,
      country: p.country,
      lat: p.lat,
      lon: p.lon,
      topic: p.topic,
    }));

    const intro = await generateIntro(anthropicKey, articles);

    return {
      articles,
      intro,
      updatedAt: new Date().toISOString(),
      error: null,
    };
  } catch (e) {
    console.error("[news] buildPayload error:", e);
    return {
      articles: [],
      intro: null,
      updatedAt: new Date().toISOString(),
      error: e instanceof Error ? e.message : "Failed to fetch news",
    };
  }
}

export { BRIEFING_UNAVAILABLE };

export const getRegulatoryFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedPayload> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.payload;
    if (inflight) return inflight;
    inflight = buildPayload()
      .then((payload) => {
        const succeeded = payload.error === null || payload.articles.length > 0;
        // Cache failures briefly too, so an upstream outage doesn't turn every
        // visitor into a fresh NewsAPI + Claude call until it recovers.
        cache = {
          payload,
          expiresAt: succeeded ? weeklyExpiresAt() : Date.now() + ERROR_CACHE_MS,
        };
        return payload;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
);
