// Minimal RSS 1.0 (RDF) / RSS 2.0 parser for official policy-body feeds.
// Deliberately dependency-free: these feeds are simple, and the site only
// needs title, link, description and date from each item.

export type FeedItem = {
  title: string;
  link: string;
  description: string;
  /** ISO 8601 string, or null if the feed's date couldn't be parsed. */
  date: string | null;
};

export type PrimaryFeed = {
  /** Display name, used as the article "source". */
  name: string;
  url: string;
};

// Official publication feeds from financial and policy authorities. Each was
// checked as a live, well-formed feed before being added. Items are filtered
// to AI-relevant ones before they reach curation (see `isAiRelevant`).
export const PRIMARY_FEEDS: PrimaryFeed[] = [
  { name: "Financial Stability Board", url: "https://www.fsb.org/feed/" },
  { name: "Bank of England", url: "https://www.bankofengland.co.uk/rss/news" },
  { name: "Financial Conduct Authority", url: "https://www.fca.org.uk/news/rss.xml" },
  { name: "European Central Bank", url: "https://www.ecb.europa.eu/rss/press.html" },
  { name: "BIS (central bankers' speeches)", url: "https://www.bis.org/doclist/cbspeeches.rss" },
];

/** Domains the primary feeds link to; merged into the site's link allowlist. */
export const PRIMARY_DOMAINS = [
  "fsb.org",
  "bankofengland.co.uk",
  "fca.org.uk",
  "ecb.europa.eu",
  "bis.org",
];

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

function clean(raw: string | undefined): string {
  if (!raw) return "";
  const unwrapped = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  // Decode first so entity-escaped HTML in descriptions is stripped too.
  return decodeEntities(unwrapped)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string | undefined {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i");
  return block.match(re)?.[1];
}

/**
 * Parse a feed date into ISO 8601. Handles RFC 822 (RSS 2.0), ISO 8601
 * (RSS 1.0 dc:date), and the FCA's non-standard
 * "Tuesday, November 3, 2026 - 10:03".
 */
export function parseFeedDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    // "Tuesday, November 3, 2026 - 10:03" → "November 3, 2026 10:03 UTC"
    const m = s.match(/^[A-Za-z]+,\s*([A-Za-z]+ \d{1,2}, \d{4})\s*-\s*(\d{1,2}:\d{2})$/);
    if (m) d = new Date(`${m[1]} ${m[2]} UTC`);
  }
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml: string): FeedItem[] {
  const blocks = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];
  return blocks
    .map((b) => ({
      title: clean(tag(b, "title")),
      link: clean(tag(b, "link")),
      description: clean(tag(b, "description")),
      date: parseFeedDate(clean(tag(b, "pubDate") ?? tag(b, "dc:date"))),
    }))
    .filter((i) => i.title.length > 0 && /^https?:\/\//.test(i.link));
}

// Word-boundary match so "AI" doesn't hit "said" or "maintain".
const AI_PATTERN =
  /\b(AI|A\.I\.|artificial intelligence|machine learning|generative|agentic|large language model|LLMs?|algorithm(s|ic)?|automated decision)\b/i;

export function isAiRelevant(item: Pick<FeedItem, "title" | "description">): boolean {
  return AI_PATTERN.test(`${item.title} ${item.description}`);
}
