import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — RAI Pulse" },
      {
        name: "description",
        content:
          "About RAI Pulse — a personal, curated briefing on AI governance, geopolitics and responsible AI.",
      },
      { property: "og:title", content: "About — RAI Pulse" },
      {
        property: "og:description",
        content:
          "A personal briefing on AI governance, geopolitics and responsible AI.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout
      eyebrow="About"
      title="About Responsible AI Pulse"
      description="A weekly briefing on AI governance, geopolitics and responsible AI practice."
    >
      <div className="max-w-2xl space-y-5 text-base leading-relaxed text-foreground/90">
        <p>
          I work in responsible AI, and I built RAI Pulse to solve my own
          problem: keeping up with AI governance news is easy; understanding
          what it actually means for organisations is not.
        </p>
        <p>
          Most coverage stops at “a new regulation passed.” I'm interested in
          the layer underneath: how diverging rules across the EU, US, China,
          and beyond create real strategic and compliance questions for large
          enterprises, and why geopolitics is becoming impossible to separate
          from responsible AI practice.
        </p>
        <p>
          My interest sits at the intersection of international relations, AI,
          and ethics. RAI Pulse is where I put that lens to work; a weekly
          briefing that tracks what's happening and translates why it matters.
        </p>
        <p>
          Everything here is analysis, not opinion. The perspective shows what
          I choose to cover and which implications I flag.
        </p>
        <p>
          I built this site myself as an exercise in applied AI. The summaries
          are AI-assisted, the judgment is mine.
        </p>
        <p className="pt-2 font-medium text-foreground">ISABEL JORQUERA</p>
      </div>
    </SiteLayout>
  );
}
