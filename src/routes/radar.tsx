import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, TagBadge } from "@/components/site-layout";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Radar — RAI Pulse" },
      {
        name: "description",
        content:
          "Upcoming AI governance deadlines, open consultations and enforcement actions worth watching.",
      },
      { property: "og:title", content: "Radar — RAI Pulse" },
      {
        property: "og:description",
        content: "What's coming next in AI governance, at a glance.",
      },
    ],
  }),
  component: RadarPage,
});

const ITEMS = [
  {
    when: "Aug 2026",
    title: "EU AI Act — High-risk system obligations apply",
    kind: "Deadline",
    body: "Full conformity assessment, risk management, logging and post-market monitoring duties become enforceable for Annex III systems.",
    tags: ["EU AI Act", "High-Risk AI"],
  },
  {
    when: "Sep 2026",
    title: "ICO — Automated decision-making consultation closes",
    kind: "Consultation",
    body: "Views sought on safeguards for solely automated decisions with significant effects on individuals.",
    tags: ["UK", "Enforcement"],
  },
  {
    when: "Q4 2026",
    title: "First expected GPAI systemic risk designation review",
    kind: "Watch",
    body: "EU AI Office is expected to publish its first review of designated systemic risk models and mitigations reported.",
    tags: ["GPAI"],
  },
  {
    when: "Q1 2027",
    title: "Revised Product Liability Directive — national transposition",
    kind: "Deadline",
    body: "Member states expected to transpose expanded liability regime covering software and AI systems.",
    tags: ["AI Liability"],
  },
  {
    when: "Rolling",
    title: "OECD AI incidents monitor — quarterly release",
    kind: "Watch",
    body: "Sectoral breakdown of reported AI incidents, aligned with EU AI Act risk categorisation.",
    tags: ["Global Frameworks"],
  },
];

function RadarPage() {
  return (
    <SiteLayout
      eyebrow="What to watch"
      title="Radar"
      description="Upcoming deadlines, open consultations and enforcement signals across the AI governance landscape."
    >
      <ol className="relative border-l border-border/70">
        {ITEMS.map((item) => (
          <li key={item.title} className="mb-6 ml-6">
            <span className="absolute -left-1.5 mt-2 h-3 w-3 rounded-full border border-primary bg-background" />
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{item.when}</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] uppercase tracking-wider">
                  {item.kind}
                </span>
              </div>
              <h2 className="mt-2 text-base font-semibold leading-snug">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <TagBadge key={t}>{t}</TagBadge>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </SiteLayout>
  );
}