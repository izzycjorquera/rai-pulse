import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/read")({
  head: () => ({
    meta: [
      { title: "Read of the Week — RAI Pulse" },
      {
        name: "description",
        content:
          "One paper or book worth your time, with a three-sentence digest for responsible AI practitioners.",
      },
      { property: "og:title", content: "Read of the Week — RAI Pulse" },
      {
        property: "og:description",
        content:
          "One paper or book worth your time, with a three-sentence digest.",
      },
    ],
  }),
  component: ReadOfTheWeekPage,
});

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

function ReadOfTheWeekPage() {
  return (
    <SiteLayout
      eyebrow="Deep dive"
      title="Read of the week"
      description="One paper or book worth your time, with a three-sentence digest."
    >
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/80 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {READ_OF_THE_WEEK.type}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {READ_OF_THE_WEEK.title}
              </span>
              <span className="text-border">·</span>
              <span>{READ_OF_THE_WEEK.author}</span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {READ_OF_THE_WEEK.summary}
            </p>
            <ul className="mt-4 space-y-2">
              {READ_OF_THE_WEEK.sentences.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm leading-relaxed text-foreground"
                >
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
    </SiteLayout>
  );
}