import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, TagBadge } from "@/components/site-layout";

export const Route = createFileRoute("/")({
  component: Index,
});

type Article = {
  title: string;
  source: string;
  date: string;
  summary: string;
  tags: string[];
};

const ARTICLES: Article[] = [
  {
    title: "EU AI Office publishes GPAI code of practice signatories update",
    source: "European Commission",
    date: "2 days ago",
    summary:
      "Providers of general-purpose AI models detail transparency and copyright commitments ahead of August enforcement milestones.",
    tags: ["EU AI Act", "GPAI"],
  },
  {
    title: "NIST releases updated AI RMF profile for generative systems",
    source: "NIST",
    date: "4 days ago",
    summary:
      "New guidance sharpens risk categorisation for foundation models, with expanded evaluation and red-teaming expectations.",
    tags: ["Standards", "NIST"],
  },
  {
    title: "ICO opens consultation on automated decision-making rules",
    source: "ICO",
    date: "1 week ago",
    summary:
      "UK regulator seeks views on how Article 22-style protections should apply under the reformed data protection regime.",
    tags: ["UK", "Enforcement"],
  },
  {
    title: "OECD updates AI incidents monitor with sectoral breakdown",
    source: "OECD.AI",
    date: "1 week ago",
    summary:
      "Financial services and healthcare see largest rise in reported incidents; methodology now aligns with EU AI Act categories.",
    tags: ["Global Frameworks", "Sector News"],
  },
  {
    title: "First AI Act high-risk system enforcement action signalled",
    source: "IAPP",
    date: "2 weeks ago",
    summary:
      "A national market surveillance authority previews the first formal investigation of a workplace monitoring system.",
    tags: ["Enforcement", "High-Risk AI"],
  },
  {
    title: "Ada Lovelace Institute: liability gaps in agentic AI supply chains",
    source: "Ada Lovelace Institute",
    date: "3 weeks ago",
    summary:
      "New report maps accountability shortfalls when autonomous agents chain together third-party models and tools.",
    tags: ["AI Liability", "Research"],
  },
];

function Index() {
  return (
    <SiteLayout
      eyebrow="Latest briefing"
      title="The week in AI governance"
      description="Curated updates across regulation, enforcement, standards and responsible AI practice — filtered for practitioners."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {ARTICLES.map((a) => (
          <li
            key={a.title}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{a.source}</span>
              <span>{a.date}</span>
            </div>
            <h2 className="mt-3 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
              {a.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {a.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {a.tags.map((t) => (
                <TagBadge key={t}>{t}</TagBadge>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </SiteLayout>
  );
}
