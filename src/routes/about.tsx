import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — RAI Pulse" },
      {
        name: "description",
        content:
          "About RAI Pulse — a personal, curated briefing on AI governance and responsible AI.",
      },
      { property: "og:title", content: "About — RAI Pulse" },
      {
        property: "og:description",
        content: "A personal briefing on AI governance and responsible AI.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout
      eyebrow="About"
      title="A personal briefing on AI governance"
      description="RAI Pulse is a curated resource I built to track the moves that matter across regulation, standards and responsible AI practice — and, honestly, to prove I could build it."
    >
      <div className="max-w-2xl space-y-5 text-base leading-relaxed text-foreground/90">
        <p>
          I work in responsible AI. This site is where I keep the signal separate from
          the noise — enforcement actions, consultation deadlines, standards updates
          and the occasional research report worth reading twice.
        </p>
        <p>
          It's intentionally light: no login, no newsletter capture, no clutter. Just
          the updates, organised the way I want to read them.
        </p>
        <p className="text-sm text-muted-foreground">
          Placeholder content while sources are being wired up. Say hello on{" "}
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            LinkedIn
          </a>
          .
        </p>
      </div>
    </SiteLayout>
  );
}