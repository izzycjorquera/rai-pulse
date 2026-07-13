import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { MILESTONES, type Milestone } from "@/content/radar";

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

const SOON_DAYS = 60;
const DAY_MS = 24 * 60 * 60_000;

function isSoon(date: string) {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  return diff > 0 && diff <= SOON_DAYS * DAY_MS;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function splitMilestones(milestones: Milestone[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming: Milestone[] = [];
  const past: Milestone[] = [];

  for (const m of milestones) {
    const d = new Date(m.date);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() < now.getTime()) {
      past.push(m);
    } else {
      upcoming.push(m);
    }
  }

  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { upcoming, past };
}

function StatusDot({ status }: { status: Milestone["status"] }) {
  const color =
    status === "in-force"
      ? "bg-lime"
      : status === "delayed"
        ? "bg-muted-foreground"
        : "bg-primary";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${color}`}
      aria-hidden="true"
    />
  );
}

function JurisdictionBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      {children}
    </span>
  );
}

function SoonBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-lime px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1F1D1A]">
      Soon
    </span>
  );
}

function TimelineItem({ milestone }: { milestone: Milestone }) {
  return (
    <li className="relative pl-8">
      <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-display text-base font-semibold text-primary">
            {formatDate(milestone.date)}
          </span>
          <JurisdictionBadge>{milestone.jurisdiction}</JurisdictionBadge>
          {isSoon(milestone.date) && <SoonBadge />}
          <StatusDot status={milestone.status} />
        </div>
        <h2 className="mt-2 font-serif text-lg font-semibold leading-snug">
          {milestone.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {milestone.description}
        </p>
        <p className="mt-3 border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-foreground/90">
          {milestone.implication}
        </p>
      </div>
    </li>
  );
}

function RecentlyInForce({ milestones }: { milestones: Milestone[] }) {
  const [open, setOpen] = useState(false);
  if (milestones.length === 0) return null;

  return (
    <section className="mt-14">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card/60 px-5 py-4 text-left shadow-card transition-colors hover:bg-card"
        aria-expanded={open}
      >
        <div>
          <h2 className="font-serif text-xl font-semibold">Recently in force</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {milestones.length} past-dated {milestones.length === 1 ? "milestone" : "milestones"}.
          </p>
        </div>
        <span className="text-2xl text-primary" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {milestones.map((m) => (
            <div
              key={m.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-card opacity-80"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-display text-base font-semibold text-primary">
                  {formatDate(m.date)}
                </span>
                <JurisdictionBadge>{m.jurisdiction}</JurisdictionBadge>
                <StatusDot status={m.status} />
              </div>
              <h3 className="mt-2 font-serif text-base font-semibold leading-snug">
                {m.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {m.description}
              </p>
              <p className="mt-3 border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-foreground/90">
                {m.implication}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RadarPage() {
  const { upcoming, past } = splitMilestones(MILESTONES);

  return (
    <SiteLayout
      eyebrow="What to watch"
      title="Radar"
      description="Upcoming deadlines, open consultations and enforcement signals across the AI governance landscape."
    >
      <div className="relative">
        <div className="absolute left-0 top-2 bottom-0 w-px bg-primary/30" />
        <ol className="relative space-y-6">
          {upcoming.map((m) => (
            <TimelineItem key={m.title} milestone={m} />
          ))}
        </ol>
      </div>
      <RecentlyInForce milestones={past} />
    </SiteLayout>
  );
}
