import { createServerFn } from "@tanstack/react-start";
import { weeklyExpiresAt } from "./cache-schedule";

export type GovernanceArticle = {
  title: string;
  source: string;
  date: string;
  take: string;
  takeGenerated: boolean;
  url: string;
};

type GovernancePayload = {
  articles: GovernanceArticle[];
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

const EXCLUDE = /\b(regulation|regulatory|eu ai act|compliance)\b/i;

const CURATION_PROMPT =
  "This section covers COMPANY CONDUCT ONLY: product launches, model releases, enterprise deployments, acquisitions and other corporate AI decisions. EXCLUDE government policy, regulation, laws and enforcement (those belong to a separate regulation section) and EXCLUDE national strategy, chip policy or export controls (those belong to a separate geopolitics section). From these articles, select the 2-3 most consequential corporate stories of the week for AI governance practitioners and briefly say why each matters. Plain text only, no markdown, no asterisks, no bold. Respond with ONLY a JSON array like [{\"index\":0,\"why\":\"...\"}]. The 'why' field must be one short sentence, roughly 25 words maximum, focused on the governance, compliance or accountability implication. Do not include any commentary outside the JSON.";

const NEWS_TIMEOUT_MS = 6_000;
const CURATION_TIMEOUT_MS = 12_000;
let cache: { payload: GovernancePayload; expiresAt: number } | null = null;
let inflight: Promise<GovernancePayload> | null = null;

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

type Candidate = {
  title: string;
  source: string;
  date: string;
  description: string;
  url: string;
};

async function curateWithClaude(
  apiKey: string,
  candidates: Candidate[],
): Promise<{ index: number; why: string }[] | null> {
  const list = candidates
    .map(
      (c, i) =>
        `${i}. ${c.title}\n   Source: ${c.source}\n   ${c.description}`,
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
    const parsed = JSON.parse(match[0]) as Array<{ index: number; why: string }>;
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

async function buildPayload(): Promise<GovernancePayload> {
  const newsKey = process.env.NEWSAPI_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const nowIso = new Date().toISOString();
  if (!newsKey)
    return { articles: [], updatedAt: nowIso, error: "Missing NEWSAPI_KEY" };

  const q = encodeURIComponent(
    '"AI deployment" OR "foundation model" OR "AI acquisition" OR "AI product launch" OR "enterprise AI"',
  );
  const domains =
    "reuters.com,ft.com,wired.com,technologyreview.com,theverge.com";
  const from = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=25&from=${from}&domains=${domains}`;

  const allowed = domains.split(",");
  const isAllowed = (u: string) => {
    try {
      const h = new URL(u).hostname.replace(/^www\./, "");
      return allowed.some((d) => h === d || h.endsWith(`.${d}`));
    } catch {
      return false;
    }
  };

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
        articles: [],
        updatedAt: nowIso,
        error: json.message ?? `HTTP ${res.status}`,
      };
    }

    const candidates: Candidate[] = json.articles
      .filter(
        (a) =>
          a.title &&
          a.description &&
          a.url &&
          isAllowed(a.url) &&
          !EXCLUDE.test(a.title),
      )
      .slice(0, 15)
      .map((a) => ({
        title: a.title as string,
        source: a.source.name ?? "Unknown",
        date: relativeDate(a.publishedAt),
        description: a.description as string,
        url: a.url,
      }));

    let articles: GovernanceArticle[];
    if (anthropicKey && candidates.length > 0) {
      const picks = await curateWithClaude(anthropicKey, candidates);
      if (picks && picks.length > 0) {
        articles = picks.map((p) => {
          const c = candidates[p.index];
          return {
            title: c.title,
            source: c.source,
            date: c.date,
            take: p.why.trim(),
            takeGenerated: true,
            url: c.url,
          };
        });
      } else {
        articles = candidates.slice(0, 3).map((c) => ({
          title: c.title,
          source: c.source,
          date: c.date,
          take: c.description,
          takeGenerated: false,
          url: c.url,
        }));
      }
    } else {
      articles = candidates.slice(0, 3).map((c) => ({
        title: c.title,
        source: c.source,
        date: c.date,
        take: c.description,
        takeGenerated: false,
        url: c.url,
      }));
    }

    return { articles, updatedAt: nowIso, error: null };
  } catch (e) {
    return {
      articles: [],
      updatedAt: nowIso,
      error: e instanceof Error ? e.message : "Failed to fetch news",
    };
  }
}

export const getGovernanceAngle = createServerFn({ method: "GET" }).handler(
  async (): Promise<GovernancePayload> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) return cache.payload;
    if (inflight) return inflight;
    inflight = buildPayload()
      .then((payload) => {
        // Don't cache hard failures — let the next request retry immediately.
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
