import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import type { RegionSummary } from "@/lib/geopolitics.functions";

// Public world topology (110m) — small enough to load quickly.
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const REGION_COORDS: Record<RegionSummary["code"], [number, number]> = {
  NA: [-100, 40], // North America
  EU: [10, 50], // Europe
  AP: [110, 30], // Asia-Pacific
  RW: [30, 0], // Rest of World (Africa / MENA / Latin America midpoint)
};

type Props = { regions: RegionSummary[] };

export function GeopoliticsMap({ regions }: Props) {
  const active = regions.filter(
    (r) => r.summary && r.summary.trim().length > 0,
  );
  const [selectedCode, setSelectedCode] = useState<
    RegionSummary["code"] | null
  >(active[0]?.code ?? null);

  const selected = active.find((r) => r.code === selectedCode) ?? active[0];

  return (
    <div className="space-y-6">
      {/* Map + panel */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-[oklch(0.14_0.02_260)] shadow-card">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 55%), radial-gradient(circle at 80% 80%, color-mix(in oklab, var(--primary) 8%, transparent), transparent 60%)",
            }}
          />
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
                        fill: "oklch(0.28 0.02 260)",
                        stroke: "oklch(0.22 0.02 260)",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: "oklch(0.32 0.02 260)",
                        outline: "none",
                      },
                      pressed: {
                        fill: "oklch(0.32 0.02 260)",
                        outline: "none",
                      },
                    }}
                  />
                ))
              }
            </Geographies>
            {active.map((r) => {
              const isSelected = selected?.code === r.code;
              return (
                <Marker
                  key={r.code}
                  coordinates={REGION_COORDS[r.code]}
                  onClick={() => setSelectedCode(r.code)}
                  style={{
                    default: { cursor: "pointer", outline: "none" },
                    hover: { cursor: "pointer", outline: "none" },
                    pressed: { cursor: "pointer", outline: "none" },
                  }}
                >
                  {/* Outer glow */}
                  <circle
                    r={isSelected ? 18 : 14}
                    fill="var(--primary)"
                    opacity={0.18}
                  />
                  {/* Pulse ring */}
                  <circle
                    r={9}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth={1}
                    opacity={0.6}
                  >
                    <animate
                      attributeName="r"
                      values="6;14;6"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.7;0;0.7"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Core dot */}
                  <circle
                    r={isSelected ? 6 : 4.5}
                    fill="var(--primary)"
                    stroke="oklch(0.14 0.02 260)"
                    strokeWidth={1.5}
                  />
                  <title>{r.region} — click for weekly briefing</title>
                </Marker>
              );
            })}
          </ComposableMap>
          {active.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No regional signal this week.
            </div>
          )}
        </div>

        {/* Selected region panel */}
        <aside className="flex flex-col rounded-2xl border border-primary/30 bg-card p-6 shadow-card">
          {selected ? (
            <>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Weekly briefing
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {selected.region}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {selected.summary}
              </p>
              {selected.headlines.length > 0 && (
                <div className="mt-5 border-t border-border/60 pt-4">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                    Sources
                  </div>
                  <ul className="space-y-2">
                    {selected.headlines.slice(0, 3).map((h) => (
                      <li key={h.url} className="text-xs leading-snug">
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {h.title}
                        </a>
                        <span className="ml-1 text-muted-foreground">
                          — {h.source}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {active.length > 1 && (
                <div className="mt-5 flex flex-wrap gap-1.5 border-t border-border/60 pt-4">
                  {active.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => setSelectedCode(r.code)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                        selected.code === r.code
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {r.region}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No regional signal this week.
            </p>
          )}
        </aside>
      </div>

      {/* Accessible / mobile fallback list */}
      <div className="lg:hidden">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          All regions
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {active.map((r) => (
            <li
              key={r.code}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                  {r.code}
                </span>
                {r.region}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {r.summary}
              </p>
              {r.headlines.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {r.headlines.slice(0, 3).map((h) => (
                    <li key={h.url} className="text-[11px] leading-snug">
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {h.title}
                      </a>
                      <span className="ml-1 text-muted-foreground">
                        — {h.source}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}