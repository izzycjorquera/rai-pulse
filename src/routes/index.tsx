import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout, TagBadge } from "@/components/site-layout";
import { getRegulatoryFeed } from "@/lib/news.functions";
import { GeopoliticsMap } from "@/components/geopolitics-map";

const WEEK_MS = 7 * 24 * 60 * 60_000;

const feedQueryOptions = queryOptions({
  queryKey: ["regulatory-feed"],
  queryFn: () => getRegulatoryFeed(),
  staleTime: WEEK_MS,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(feedQueryOptions);
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

function UpdatedLabel({ updatedAt }: { updatedAt?: string }) {
  const formatted = updatedAt
    ? new Date(updatedAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }) + " UTC"
    : "";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {updatedAt && (
        <>
          <span>Last updated {formatted}</span>
          <span className="text-border">·</span>
        </>
      )}
      <span>New briefing every Monday</span>
    </div>
  );
}

const REGION_CODE: Record<string, string> = {
  "North America": "NA",
  Europe: "EU",
  "Asia-Pacific": "AP",
  "Rest of World": "RW",
};

function Index() {
  const { data: feed } = useSuspenseQuery(feedQueryOptions);
  const unavailable = !!feed.error && feed.articles.length === 0;
  return (
    <SiteLayout
      eyebrow="Latest briefing"
      title="This week in AI governance"
      description="The weekly briefing on responsible AI, from around the world."
    >
      <div className="space-y-14">
        <section>
          <SectionHeading
            eyebrow="This week"
            title="The stories that matter"
            description="The 8–10 most significant responsible-AI stories of the week, ranked by significance for enterprise readers."
          />
          <UpdatedLabel updatedAt={feed.updatedAt} />
          {unavailable && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Briefing temporarily unavailable.
            </div>
          )}
          {!unavailable && feed.articles.length > 0 && (
            <div className="mb-8">
              <GeopoliticsMap articles={feed.articles} />
            </div>
          )}
          {!unavailable && feed.intro && (
            <p className="mb-6 max-w-3xl rounded-2xl border border-border bg-card/60 p-5 text-sm leading-relaxed text-foreground shadow-card">
              {feed.intro}
            </p>
          )}
          {!unavailable && (
            <ol className="space-y-4">
              {feed.articles.map((a) => {
                const tags = a.topic ? [a.topic] : inferTags(`${a.title} ${a.summary}`);
                const code = a.region ? REGION_CODE[a.region] : undefined;
                return (
                  <li
                    key={a.url}
                    className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
                  >
                    {a.imageUrl && <ArticleImage src={a.imageUrl} alt="" />}
                    <div className="p-5">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {a.source}
                        </span>
                        <span className="text-border">·</span>
                        <span>{a.date}</span>
                        {a.region && (
                          <>
                            <span className="text-border">·</span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                              {code && (
                                <span className="font-bold">{code}</span>
                              )}
                              <span>{a.region}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-base font-semibold leading-snug text-primary hover:underline"
                      >
                        {a.title}
                      </a>
                      {a.enterpriseImplication && (
                        <p className="mt-3 border-l-2 border-primary pl-3 text-[13px] leading-relaxed text-foreground/90">
                          {a.enterpriseImplication}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {tags.map((t) => (
                            <TagBadge key={t}>{t}</TagBadge>
                          ))}
                        </div>
                      )}
                    </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

function ArticleImage({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <div className="aspect-video w-full overflow-hidden bg-secondary">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setOk(false)}
      />
    </div>
  );
}
