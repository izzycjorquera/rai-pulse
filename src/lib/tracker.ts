// Taxonomy and aggregation for the fragmentation tracker. Pure functions only,
// so the logic can be unit-tested without Redis or the Anthropic API.

import type { FeedArticle } from "./news.functions";

export const THEMES = [
  "Fragmentation",
  "Alignment",
  "Sovereignty",
  "Concentration risk",
  "Agentic AI",
  "Financial services",
  "Resilience & security",
] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_DESCRIPTIONS: Record<Theme, string> = {
  Fragmentation:
    "Jurisdictions diverging: conflicting rules, unilateral moves, regulatory competition.",
  Alignment:
    "Jurisdictions converging: shared standards, mutual recognition, international agreements.",
  Sovereignty:
    "National control over AI: sovereign compute and models, data localisation, export controls.",
  "Concentration risk":
    "Dependence on a small number of model, cloud or chip providers; third-party risk.",
  "Agentic AI": "Autonomous AI agents: authorisation, liability, identity and oversight.",
  "Financial services": "AI in finance, or action by financial regulators and standard setters.",
  "Resilience & security": "Operational resilience, cyber security and systemic risk from AI.",
};

export const INSTRUMENTS = [
  "Law",
  "Guidance",
  "Consultation",
  "Enforcement",
  "Statement",
  "Other",
] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export const DIRECTIONS = ["Tightening", "Loosening", "Neutral"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const REGIONS = ["North America", "Europe", "Asia-Pacific", "Rest of World"] as const;
export type Region = (typeof REGIONS)[number];

function matchFrom<T extends string>(list: readonly T[], raw: unknown): T | undefined {
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase();
  return list.find((x) => x.toLowerCase() === v);
}

/** Keep only known theme names (case-insensitive), deduplicated, max 3. */
export function normaliseThemes(raw: unknown): Theme[] {
  if (!Array.isArray(raw)) return [];
  const out: Theme[] = [];
  for (const r of raw) {
    const t = matchFrom(THEMES, r);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.slice(0, 3);
}

export const normaliseInstrument = (raw: unknown): Instrument | undefined =>
  matchFrom(INSTRUMENTS, raw);
export const normaliseDirection = (raw: unknown): Direction | undefined =>
  matchFrom(DIRECTIONS, raw);

/** Monday (UTC) of the week containing `iso`, as YYYY-MM-DD. */
export function weekKey(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

export type ArchivedWeek = {
  week: string;
  updatedAt: string;
  articles: FeedArticle[];
};

export type TrackerItem = FeedArticle & { week: string };

export type TrackerAggregate = {
  weeks: string[];
  totalTagged: number;
  /** counts[theme][region] */
  matrix: Record<Theme, Record<Region, number>>;
  directionByTheme: Record<Theme, Record<Direction, number>>;
  itemsByTheme: Record<Theme, TrackerItem[]>;
};

function emptyRecord<K extends string, V>(keys: readonly K[], make: () => V): Record<K, V> {
  return Object.fromEntries(keys.map((k) => [k, make()])) as Record<K, V>;
}

export function aggregate(weeks: ArchivedWeek[]): TrackerAggregate {
  const sorted = [...weeks].sort((a, b) => b.week.localeCompare(a.week));
  const matrix = emptyRecord(THEMES, () => emptyRecord(REGIONS, () => 0));
  const directionByTheme = emptyRecord(THEMES, () => emptyRecord(DIRECTIONS, () => 0));
  const itemsByTheme = emptyRecord(THEMES, (): TrackerItem[] => []);
  const seen = new Set<string>();
  let totalTagged = 0;

  for (const w of sorted) {
    for (const a of w.articles) {
      if (seen.has(a.url)) continue;
      seen.add(a.url);
      const themes = normaliseThemes(a.themes);
      if (themes.length === 0) continue;
      totalTagged++;
      const region = matchFrom(REGIONS, a.region) ?? "Rest of World";
      const direction = normaliseDirection(a.direction) ?? "Neutral";
      for (const t of themes) {
        matrix[t][region]++;
        directionByTheme[t][direction]++;
        itemsByTheme[t].push({ ...a, week: w.week });
      }
    }
  }

  return {
    weeks: sorted.map((w) => w.week),
    totalTagged,
    matrix,
    directionByTheme,
    itemsByTheme,
  };
}

/** Add `week` to the archive index (newest first, unique), capped at `max`. */
export function updateIndex(index: string[], week: string, max = 26): string[] {
  return [week, ...index.filter((w) => w !== week)]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, max);
}
