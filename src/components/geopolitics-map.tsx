import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type { FeedArticle } from "@/lib/news.functions";

// Public world topology (110m) — small enough to load quickly.
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type CountryGroup = {
  country: string;
  lat: number;
  lon: number;
  articles: FeedArticle[];
};

function groupByCountry(articles: FeedArticle[]): CountryGroup[] {
  const map = new Map<string, CountryGroup>();
  for (const a of articles) {
    if (
      !a.country ||
      typeof a.lat !== "number" ||
      typeof a.lon !== "number" ||
      !Number.isFinite(a.lat) ||
      !Number.isFinite(a.lon) ||
      a.lat < -90 ||
      a.lat > 90 ||
      a.lon < -180 ||
      a.lon > 180
    ) {
      continue;
    }
    const key = a.country;
    const existing = map.get(key);
    if (existing) {
      existing.articles.push(a);
    } else {
      map.set(key, {
        country: a.country,
        lat: a.lat,
        lon: a.lon,
        articles: [a],
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.articles.length - a.articles.length,
  );
}

export function GeopoliticsMap({ articles }: { articles: FeedArticle[] }) {
  const groups = useMemo(() => groupByCountry(articles), [articles]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const selected =
    (selectedCountry && groups.find((g) => g.country === selectedCountry)) ||
    null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-masthead shadow-card">
        <ComposableMap
          projectionConfig={{ scale: 155 }}
          width={900}
          height={480}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: {
                      fill: "#F3EEE4",
                      stroke: "#26307D",
                      strokeWidth: 0.4,
                      outline: "none",
                    },
                    hover: {
                      fill: "#FAF7F2",
                      outline: "none",
                    },
                    pressed: {
                      fill: "#FAF7F2",
                      outline: "none",
                    },
                  }}
                />
              ))
            }
          </Geographies>
          {groups.map((g) => {
            const isSelected = selected?.country === g.country;
            const count = g.articles.length;
            return (
              <Marker
                key={g.country}
                coordinates={[g.lon, g.lat]}
                onClick={() => setSelectedCountry(g.country)}
                style={{
                  default: { cursor: "pointer", outline: "none" },
                  hover: { cursor: "pointer", outline: "none" },
                  pressed: { cursor: "pointer", outline: "none" },
                }}
              >
                <circle
                  r={isSelected ? 10 : 8}
                  fill="var(--primary)"
                  opacity={0.25}
                />
                <circle
                  r={isSelected ? 5 : 4}
                  fill="var(--primary)"
                  stroke="#FAF7F2"
                  strokeWidth={1.5}
                />
                {count > 1 && (
                  <g transform="translate(6, -6)">
                    <circle r={6} fill="var(--lime)" stroke="#26307D" strokeWidth={0.75} />
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize={8}
                      fontWeight={700}
                      fill="#1F1D1A"
                    >
                      {count}
                    </text>
                  </g>
                )}
                <title>
                  {g.country} — {count} {count === 1 ? "story" : "stories"}
                </title>
              </Marker>
            );
          })}
        </ComposableMap>
        {groups.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-masthead-foreground/70">
            No mapped stories this week.
          </div>
        )}
      </div>

      <aside className="flex flex-col rounded-2xl border border-primary/30 bg-card p-6 shadow-card">
        {selected ? (
          <>
            <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              {selected.articles.length}{" "}
              {selected.articles.length === 1 ? "story" : "stories"}
            </div>
            <h3 className="text-xl text-foreground">
              {selected.country}
            </h3>
            <ul className="mt-4 space-y-4">
              {selected.articles.map((a) => (
                <li
                  key={a.url}
                  className="border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
                >
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-serif block text-[15px] font-semibold leading-snug text-primary hover:underline"
                  >
                    {a.title}
                  </a>
                  <div className="mt-1 font-sans text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    {a.source}
                  </div>
                  {a.enterpriseImplication && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block font-sans text-xs leading-relaxed text-foreground hover:underline"
                    >
                      {a.enterpriseImplication}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-5 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={() => setSelectedCountry(null)}
                className="rounded-full border border-border px-3 py-1 font-sans text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                ← Overview
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              This week on the map
            </div>
            <h3 className="text-xl text-foreground">
              Where the action is
            </h3>
            <p className="mt-3 font-sans text-sm leading-relaxed text-muted-foreground">
              {groups.length === 0
                ? "No mapped stories this week."
                : "Click a pin to see the stories tied to that country."}
            </p>
            {groups.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border/60 pt-4">
                {groups.map((g) => (
                  <button
                    key={g.country}
                    type="button"
                    onClick={() => setSelectedCountry(g.country)}
                    className="rounded-full border border-border px-3 py-1 font-sans text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {g.country}
                    {g.articles.length > 1 && (
                      <span className="ml-1 font-semibold text-primary">
                        · {g.articles.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}