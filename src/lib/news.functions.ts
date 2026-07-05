import { createServerFn } from "@tanstack/react-start";

export type FeedArticle = {
  title: string;
  source: string;
  date: string;
  summary: string;
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

export const getRegulatoryFeed = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ articles: FeedArticle[]; error: string | null }> => {
    const key = process.env.NEWSAPI_KEY;
    if (!key) return { articles: [], error: "Missing NEWSAPI_KEY" };

    const q = encodeURIComponent(
      '"AI regulation" OR "EU AI Act" OR "responsible AI"',
    );
    const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=6`;

    try {
      const res = await fetch(url, {
        headers: { "X-Api-Key": key, "User-Agent": "RAI-Pulse/1.0" },
      });
      const json = (await res.json()) as NewsApiResponse;
      if (!res.ok || json.status !== "ok" || !json.articles) {
        return { articles: [], error: json.message ?? `HTTP ${res.status}` };
      }
      const articles: FeedArticle[] = json.articles
        .filter((a) => a.title && a.description)
        .slice(0, 6)
        .map((a) => ({
          title: a.title as string,
          source: a.source.name ?? "Unknown",
          date: relativeDate(a.publishedAt),
          summary: a.description as string,
          url: a.url,
        }));
      return { articles, error: null };
    } catch (e) {
      return {
        articles: [],
        error: e instanceof Error ? e.message : "Failed to fetch news",
      };
    }
  },
);