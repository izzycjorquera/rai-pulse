import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, TagBadge } from "@/components/site-layout";

export const Route = createFileRoute("/themes")({
  head: () => ({
    meta: [
      { title: "Themes — RAI Pulse" },
      {
        name: "description",
        content:
          "Curated theme pages covering the EU AI Act, GPAI, high-risk AI, AI liability and global governance frameworks.",
      },
      { property: "og:title", content: "Themes — RAI Pulse" },
      {
        property: "og:description",
        content: "Explainers and reading lists for the core AI governance debates.",
      },
    ],
  }),
  component: ThemesPage,
});

const THEMES = [
  {
    title: "EU AI Act",
    blurb:
      "The world's first horizontal AI regulation. Track implementation timelines, delegated acts, and market surveillance activity.",
    items: [
      "GPAI code of practice signatories tracker",
      "Conformity assessment guidance for high-risk systems",
      "Prohibited practices — early enforcement signals",
    ],
    tags: ["Regulation", "EU"],
  },
  {
    title: "High-Risk AI",
    blurb:
      "Systems in employment, education, essential services and law enforcement carry the heaviest obligations.",
    items: [
      "Annex III scope updates",
      "Fundamental rights impact assessments in practice",
      "Post-market monitoring templates",
    ],
    tags: ["High-Risk AI"],
  },
  {
    title: "GPAI & Foundation Models",
    blurb:
      "Obligations for providers of general-purpose models, including transparency, copyright and systemic risk tiers.",
    items: [
      "Systemic risk thresholds and FLOPs debate",
      "Training data summaries — templates",
      "Downstream provider deployment duties",
    ],
    tags: ["GPAI"],
  },
  {
    title: "AI Liability",
    blurb:
      "How existing product liability and tort regimes are being reshaped for autonomous and agentic systems.",
    items: [
      "Revised Product Liability Directive scope",
      "Agentic AI supply-chain accountability",
      "Insurance market response",
    ],
    tags: ["AI Liability"],
  },
  {
    title: "Global Frameworks",
    blurb:
      "How OECD, NIST, ISO/IEC, UK, US and APAC frameworks interoperate — or don't.",
    items: [
      "NIST AI RMF & GenAI profile",
      "ISO/IEC 42001 adoption",
      "UK sector-led model and pro-innovation approach",
    ],
    tags: ["Global Frameworks", "Standards"],
  },
];

function ThemesPage() {
  return (
    <SiteLayout
      eyebrow="Deep dives"
      title="Themes"
      description="Topic pages combining a short explainer with the source material worth reading."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {THEMES.map((t) => (
          <section
            key={t.title}
            className="rounded-xl border border-border bg-card p-6 shadow-card"
          >
            <div className="flex flex-wrap gap-1.5">
              {t.tags.map((tag) => (
                <TagBadge key={tag}>{tag}</TagBadge>
              ))}
            </div>
            <h2 className="mt-3 text-lg font-semibold tracking-tight">
              {t.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t.blurb}
            </p>
            <ul className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
              {t.items.map((i) => (
                <li key={i} className="flex gap-3 text-foreground/90">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-primary/70" />
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SiteLayout>
  );
}