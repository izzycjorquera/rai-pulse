import { createServerFn } from "@tanstack/react-start";
import { weeklyExpiresAt } from "./cache-schedule";

export type FeedArticle = {
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
};

export type FeedPayload = {
  articles: FeedArticle[];
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
  "From these articles, select the 2-3 most consequential for AI governance practitioners and briefly say why each matters. Plain text only, no markdown, no asterisks, no bold. Respond with ONLY a JSON array like [{\"index\":0,\"why\":\"...\"}]. The 'why' field must be one short sentence, roughly 25 words maximum. Do not include any commentary outside the JSON.";

const NEWS_TIMEOUT_MS = 6_000;
const CURATION_TIMEOUT_MS = 12_000;
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
): Promise<{ index: number; why: string }[] | null> {
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
          max_tokens: 400,
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
      why: string;
    }>;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (p) =>
          typeof p.index === "number" &&
          typeof p.why === "string" &&
          p.index >= 0 &&
          p.index < candidates.length,
      )
      .slice(0, 3);
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
      updatedAt: new Date().toISOString(),
      error: "Missing NEWSAPI_KEY",
    };
  }

    const q = encodeURIComponent(
      '"AI regulation" OR "EU AI Act" OR "responsible AI"',
    );
    const domains =
      "bbc.co.uk,reuters.com,ft.com,politico.eu,theverge.com,wired.com,technologyreview.com,theguardian.com";
    const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=20&domains=${domains}`;

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
          updatedAt: new Date().toISOString(),
          error: json.message ?? `HTTP ${res.status}`,
        };
      }
      const candidates: Candidate[] = json.articles
        .filter(
          (a) => a.title && a.description && a.url && isAllowedUrl(a.url),
        )
        .slice(0, 15)
        .map((a) => ({
          title: a.title as string,
          source: a.source.name ?? "Unknown",
          date: relativeDate(a.publishedAt),
          summary: a.description as string,
          url: a.url,
        }));

      let articles: FeedArticle[];
      if (anthropicKey && candidates.length > 0) {
        const picks = await curateWithClaude(anthropicKey, candidates);
        if (picks && picks.length > 0) {
          articles = picks.map((p) => ({
            ...candidates[p.index],
            summary: p.why.trim(),
          }));
        } else {
          articles = candidates.slice(0, 3);
        }
      } else {
        articles = candidates.slice(0, 3);
      }

      return {
        articles,
        updatedAt: new Date().toISOString(),
        error: null,
      };
    } catch (e) {
      return {
        articles: [],
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
          cache = { payload, expiresAt: weeklyExpiresAt() };
        }
        return payload;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
);