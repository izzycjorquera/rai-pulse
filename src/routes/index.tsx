import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { SiteLayout, TagBadge } from "@/components/site-layout";
import { getRegulatoryFeed } from "@/lib/news.functions";
import { getGovernanceAngle } from "@/lib/governance.functions";

const feedQueryOptions = queryOptions({
  queryKey: ["regulatory-feed"],
  queryFn: () => getRegulatoryFeed(),
  staleTime: 5 * 60_000,
});

const governanceQueryOptions = queryOptions({
  queryKey: ["governance-angle"],
  queryFn: () => getGovernanceAngle(),
  staleTime: 15 * 60_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(feedQueryOptions);
    context.queryClient.prefetchQuery(governanceQueryOptions);
  },
  component: Index,
});

function inferTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  if (t.includes("eu ai act") || t.includes("ai act")) tags.push("EU AI Act");
  if (t.includes("gpai") || t.includes("general-purpose")) tags.push("GPAI");
  if (t.includes("nist")) tags.push("NIST");
  if (t.includes("enforcement") || t.includes("fine") || t.includes("penalt"))
    tags.push("Enforcement");
  if (t.includes("liability")) tags.push("AI Liability");
  if (t.includes("responsible ai") || t.includes("ethics"))
    tags.push("Responsible AI");
  if (tags.length === 0) tags.push("AI Regulation");
  return tags.slice(0, 2);
}

const GEOPOLITICS: {
  region: string;
  code: string;
  headline: string;
  status: string;
}[] = [
  {
    region: "United States",
    code: "US",
    headline: "Executive order on AI safety enforcement uncertain",
    status:
      "Agency rules (NIST, FTC, SEC) continue to fill the gap while federal legislation remains stalled.",
  },
  {
    region: "European Union",
    code: "EU",
    headline: "AI Act obligations now apply to prohibited practices",
    status:
      "High-risk system and GPAI deadlines roll through 2025–2026; the AI Office is staffing enforcement.",
  },
  {
    region: "United Kingdom",
    code: "UK",
    headline: "Pro-innovation framework under consultation",
    status:
      "Sector regulators (ICO, FCA, Ofcom, CMA) are expected to publish cross-sector guidance.",
  },
  {
    region: "China",
    code: "CN",
    headline: "Draft algorithmic and deepfake rules advance",
    status:
      "State-led standards move fast; compliance focus on algorithmic filing and content labels.",
  },
];

const READ_OF_THE_WEEK = {
  title: "Frontier AI Regulation: Managing Emerging Risks to Public Safety",
  author: "MIT Future of Life & Legal Priorities",
  type: "Paper",
  summary:
    "This paper compares regulatory instruments for frontier models — export controls, compute thresholds, safety evaluations and liability regimes — and argues that ex-ante evaluation gates are the most adaptable tool when capabilities are uncertain.",
  sentences: [
    "It draws on case studies from biosafety, aviation and nuclear governance to show how safety cases can be formalised without over-specifying technical details.",
    "The authors propose a tiered system where model providers must submit safety evaluations before large-scale deployment, with independent audits triggered by compute thresholds.",
    "The relevance for RAI practitioners is that it bridges technical risk assessment and legal accountability, making it a useful reference for anyone writing policy memos or model cards.",
  ],
  whyItMatters: "Bridges safety and law",
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
        <span className="h-px w-6 bg-primary/60" />
        {eyebrow}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function Index() {
  const { data: feed } = useSuspenseQuery(feedQueryOptions);
  const articles = feed.articles;
  return (
    <SiteLayout
      eyebrow="Latest briefing"
      title="The week in AI governance"
      description="Curated updates across regulation, enforcement, standards and responsible AI practice — filtered for practitioners."
    >
      <div className="space-y-14">
        {/* Feed */}
        <section>
          <SectionHeading
            eyebrow="Industry updates"
            title="Regulatory feed"
            description="Headlines from regulators, standards bodies and civil society with governance context attached."
          />
          {feed.error && articles.length === 0 && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Couldn't load live articles: {feed.error}
            </div>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-flow-dense">
            {articles.map((a, i) => {
              const featured = i === 0;
              const tags = inferTags(`${a.title} ${a.summary}`);
              return (
                <li
                  key={a.title}
                  className={`group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/50 ${
                    featured ? "lg:col-span-2 lg:row-span-2 lg:p-7" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">{a.source}</span>
                    <span>{a.date}</span>
                  </div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block"
                  >
                    <h2
                      className={`font-semibold leading-snug text-primary hover:underline ${
                        featured ? "text-2xl sm:text-3xl" : "text-base"
                      }`}
                    >
                      {a.title}
                    </h2>
                  </a>
                  <p
                    className={`mt-2 flex-1 leading-relaxed text-muted-foreground ${
                      featured ? "text-base" : "text-sm"
                    }`}
                  >
                    {a.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <TagBadge key={t}>{t}</TagBadge>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Governance Angle */}
        <section>
          <SectionHeading
            eyebrow="Reframe"
            title="Governance angle"
            description="Tech news seen through the lens of compliance, risk and accountability."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-flow-dense">
            {GOVERNANCE_ANGLE.map((item, i) => (
              <li
                key={item.title}
                className={`group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/50 ${
                  i === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-primary">{item.angle}</span>
                  <span className="text-border">·</span>
                  <span className="font-medium text-foreground/80">{item.title}</span>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <TagBadge key={t}>{t}</TagBadge>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Geopolitics Watch */}
        <section>
          <SectionHeading
            eyebrow="Global map"
            title="Geopolitics watch"
            description="Quick read on how the US, EU, UK and China are positioning AI regulation."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GEOPOLITICS.map((g) => (
              <div
                key={g.code}
                className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/50"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                    {g.code}
                  </span>
                  {g.region}
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground">
                  {g.headline}
                </h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {g.status}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Read of the Week */}
        <section>
          <SectionHeading
            eyebrow="Deep dive"
            title="Read of the week"
            description="One paper or book worth your time, with a three-sentence digest."
          />
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {READ_OF_THE_WEEK.type}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{READ_OF_THE_WEEK.title}</span>
                  <span className="text-border">·</span>
                  <span>{READ_OF_THE_WEEK.author}</span>
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {READ_OF_THE_WEEK.summary}
                </p>
                <ul className="mt-4 space-y-2">
                  {READ_OF_THE_WEEK.sentences.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Why it matters: {READ_OF_THE_WEEK.whyItMatters}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
