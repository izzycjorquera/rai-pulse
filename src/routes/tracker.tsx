import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout, TagBadge } from "@/components/site-layout";
import { getTracker, type SynthesisSection, type TrackerPayload } from "@/lib/tracker.functions";
import { DIRECTIONS, REGIONS, THEME_DESCRIPTIONS, THEMES, type Theme } from "@/lib/tracker";

const DAY_MS = 24 * 60 * 60_000;

const trackerQueryOptions = queryOptions({
  queryKey: ["tracker"],
  queryFn: () => getTracker(),
  staleTime: DAY_MS,
});

export const Route = createFileRoute("/tracker")({
  head: () => ({
    meta: [
      { title: "Fragmentation tracker | RAI Pulse" },
      {
        name: "description",
        content:
          "Where AI regulation is converging and diverging across jurisdictions, built from RAI Pulse's weekly briefings.",
      },
      { property: "og:title", content: "Fragmentation tracker | RAI Pulse" },
      {
        property: "og:description",
        content: "Where AI regulation is converging and diverging across jurisdictions.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(trackerQueryOptions);
  },
  component: TrackerPage,
});

const REGION_SHORT: Record<(typeof REGIONS)[number], string> = {
  "North America": "N. America",
  Europe: "Europe",
  "Asia-Pacific": "Asia-Pacific",
  "Rest of World": "Rest of World",
};

function formatWeek(week: string) {
  return new Date(`${week}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Coverage({ data }: { data: TrackerPayload }) {
  if (data.weeks.length === 0) return null;
  const newest = data.weeks[0];
  const oldest = data.weeks[data.weeks.length - 1];
  return (
    <p className="mb-8 text-xs text-muted-foreground">
      Built from {data.totalTagged} tagged {data.totalTagged === 1 ? "story" : "stories"} across{" "}
      {data.weeks.length} weekly {data.weeks.length === 1 ? "briefing" : "briefings"}
      {data.weeks.length > 1 && (
        <>
          {" "}
          (weeks of {formatWeek(oldest)} to {formatWeek(newest)})
        </>
      )}
      . Updated every Monday.
    </p>
  );
}

function SynthesisBlock({ label, section }: { label: string; section: SynthesisSection }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{section.text}</p>
      {section.sources.length > 0 && (
        <ul className="mt-2 space-y-1">
          {section.sources.map((s) => (
            <li key={s.url} className="text-xs">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Synthesis({ data }: { data: TrackerPayload }) {
  if (!data.synthesis) return null;
  return (
    <section className="mb-12 rounded-2xl border border-border bg-card/60 p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-semibold">The picture so far</h2>
        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          AI-generated synthesis
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <SynthesisBlock label="Converging" section={data.synthesis.converging} />
        <SynthesisBlock label="Diverging" section={data.synthesis.diverging} />
        <SynthesisBlock label="Watch" section={data.synthesis.watch} />
      </div>
      <p className="mt-5 text-[11px] text-muted-foreground">
        Drafted by Claude from the tagged stories below and linked to the stories it relied on.
        Check the sources before relying on it.
      </p>
    </section>
  );
}

function Matrix({
  data,
  selected,
  onSelect,
}: {
  data: TrackerPayload;
  selected: Theme;
  onSelect: (t: Theme) => void;
}) {
  const max = Math.max(1, ...THEMES.flatMap((t) => REGIONS.map((r) => data.matrix[t][r])));
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-semibold">Themes by region</h2>
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Stories per theme and region, with the direction of travel. Select a theme to see its
        stories.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Theme</th>
              {REGIONS.map((r) => (
                <th key={r} className="px-3 py-3 text-center font-medium">
                  {REGION_SHORT[r]}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Direction</th>
            </tr>
          </thead>
          <tbody>
            {THEMES.map((t) => {
              const dir = data.directionByTheme[t];
              const isSelected = t === selected;
              return (
                <tr
                  key={t}
                  className={`border-b border-border last:border-0 ${isSelected ? "bg-primary/5" : ""}`}
                >
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => onSelect(t)}
                      className={`text-left hover:text-primary hover:underline ${isSelected ? "text-primary" : ""}`}
                      aria-pressed={isSelected}
                    >
                      {t}
                    </button>
                  </th>
                  {REGIONS.map((r) => {
                    const n = data.matrix[t][r];
                    return (
                      <td key={r} className="px-3 py-3 text-center">
                        <span
                          className="inline-flex h-8 w-10 items-center justify-center rounded-md text-xs font-semibold"
                          style={{
                            backgroundColor:
                              n > 0
                                ? `color-mix(in oklab, var(--primary) ${Math.round(12 + (n / max) * 60)}%, transparent)`
                                : undefined,
                          }}
                        >
                          {n > 0 ? n : <span className="text-muted-foreground/50">·</span>}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {DIRECTIONS.filter((d) => dir[d] > 0)
                      .map((d) => `${dir[d]} ${d.toLowerCase()}`)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ThemeStories({ data, theme }: { data: TrackerPayload; theme: Theme }) {
  const items = data.itemsByTheme[theme];
  return (
    <section>
      <h2 className="text-xl font-semibold">{theme}</h2>
      <p className="mt-1 mb-4 max-w-2xl text-sm text-muted-foreground">
        {THEME_DESCRIPTIONS[theme]}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stories tagged with this theme yet.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((a) => (
            <li
              key={`${a.week}-${a.url}`}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{a.source}</span>
                <span className="text-border">·</span>
                <span>Week of {formatWeek(a.week)}</span>
                {a.country && (
                  <>
                    <span className="text-border">·</span>
                    <span>{a.country}</span>
                  </>
                )}
                {a.primary && (
                  <span className="rounded-full bg-lime px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1F1D1A]">
                    Primary source
                  </span>
                )}
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="block font-semibold leading-snug text-primary hover:underline"
              >
                {a.title}
              </a>
              {a.enterpriseImplication && (
                <p className="mt-2 border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-foreground/90">
                  {a.enterpriseImplication}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.instrument && <TagBadge>{a.instrument}</TagBadge>}
                {a.direction && <TagBadge>{a.direction}</TagBadge>}
                {(a.themes ?? [])
                  .filter((t) => t !== theme)
                  .map((t) => (
                    <TagBadge key={t}>{t}</TagBadge>
                  ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function TrackerPage() {
  const { data } = useSuspenseQuery(trackerQueryOptions);
  const busiest = THEMES.reduce((best, t) =>
    data.itemsByTheme[t].length > data.itemsByTheme[best].length ? t : best,
  );
  const [selected, setSelected] = useState<Theme>(busiest);

  return (
    <SiteLayout
      eyebrow="Fragmentation tracker"
      title="Where AI regulation is pulling apart"
      description="A running view of where AI rules are converging and diverging across jurisdictions, with a focus on sovereignty, concentration risk and financial services. Built from the tags on each week's briefing, including official publications from financial authorities."
    >
      {data.totalTagged === 0 ? (
        <div className="rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground shadow-card">
          The tracker builds up from each weekly briefing. Tagged stories will appear here after the
          next Monday update.
        </div>
      ) : (
        <>
          <Coverage data={data} />
          <Synthesis data={data} />
          <Matrix data={data} selected={selected} onSelect={setSelected} />
          <ThemeStories data={data} theme={selected} />
        </>
      )}
    </SiteLayout>
  );
}
