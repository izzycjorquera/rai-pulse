import { createServerFn } from "@tanstack/react-start";

export type GovernanceArticle = {
  title: string;
  source: string;
  date: string;
  take: string;
  takeGenerated: boolean;
  url: string;
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

const SYSTEM_PROMPT =
  "You are a responsible AI governance analyst. Given a tech news headline and description, write exactly 2 sentences explaining what this development means for AI governance, compliance or accountability. Be specific and practical — write for practitioners, not academics. Do not restate the news; go straight to the implication.";

async function generateTake(
  apiKey: string,
  title: string,
  description: string,
): Promise<string | null> {
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
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Headline: ${title}\n\nDescription: ${description}`,
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

export const getGovernanceAngle = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ articles: GovernanceArticle[]; error: string | null }> => {
    const newsKey = process.env.NEWSAPI_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!newsKey) return { articles: [], error: "Missing NEWSAPI_KEY" };

    const q = encodeURIComponent(
      '"AI deployment" OR "foundation model" OR "AI acquisition" OR "AI product launch" OR "enterprise AI"',
    );
    const domains =
      "reuters.com,ft.com,wired.com,technologyreview.com,theverge.com";
    const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=25&domains=${domains}`;

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
      const res = await fetch(url, {
        headers: { "X-Api-Key": newsKey, "User-Agent": "RAI-Pulse/1.0" },
      });
      const json = (await res.json()) as NewsApiResponse;
      if (!res.ok || json.status !== "ok" || !json.articles) {
        return { articles: [], error: json.message ?? `HTTP ${res.status}` };
      }

      const filtered = json.articles
        .filter(
          (a) =>
            a.title &&
            a.description &&
            a.url &&
            isAllowed(a.url) &&
            !EXCLUDE.test(a.title),
        )
        .slice(0, 4);

      const articles = await Promise.all(
        filtered.map(async (a) => {
          const title = a.title as string;
          const description = a.description as string;
          const take = anthropicKey
            ? await generateTake(anthropicKey, title, description)
            : null;
          return {
            title,
            source: a.source.name ?? "Unknown",
            date: relativeDate(a.publishedAt),
            take: take ?? description,
            takeGenerated: Boolean(take),
            url: a.url,
          };
        }),
      );

      return { articles, error: null };
    } catch (e) {
      return {
        articles: [],
        error: e instanceof Error ? e.message : "Failed to fetch news",
      };
    }
  },
);