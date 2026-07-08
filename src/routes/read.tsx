import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

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

type ReadCard = {
  type: string;
  title: string;
  author: string;
  summary: string;
  sentences: string[];
  whyItMatters: string;
  link?: { href: string; label: string };
};

const CARDS: ReadCard[] = [
  {
    type: "Paper",
    title: "Frontier AI Regulation: Managing Emerging Risks to Public Safety",
    author: "MIT Future of Life & Legal Priorities",
    summary:
      "This paper compares regulatory instruments for frontier models — export controls, compute thresholds, safety evaluations and liability regimes — and argues that ex-ante evaluation gates are the most adaptable tool when capabilities are uncertain.",
    sentences: [
      "It draws on case studies from biosafety, aviation and nuclear governance to show how safety cases can be formalised without over-specifying technical details.",
      "The authors propose a tiered system where model providers must submit safety evaluations before large-scale deployment, with independent audits triggered by compute thresholds.",
      "The relevance for RAI practitioners is that it bridges technical risk assessment and legal accountability, making it a useful reference for anyone writing policy memos or model cards.",
    ],
    whyItMatters: "Bridges safety and law",
  },
  {
    type: "Listen",
    title: "[Episode title — replace me]",
    author: "[Podcast name — replace me]",
    summary:
      "[Recommended listen: one-line why this episode matters for responsible AI practitioners — replace with your own copy.]",
    sentences: [
      "[Optional second sentence with a specific idea or guest to flag.]",
    ],
    whyItMatters: "Recommended listen",
    link: { href: "#", label: "Listen" },
  },
  {
    type: "Book",
    title: "[Book title — replace me]",
    author: "[Author — replace me]",
    summary:
      "[One-paragraph digest of the book and why it's worth the shelf space for RAI practitioners.]",
    sentences: [
      "[Optional second sentence with the sharpest idea from the book.]",
    ],
    whyItMatters: "On the shelf",
    link: { href: "#", label: "Find the book" },
  },
];

function ReadOfTheWeekPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(CARDS.length);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <SiteLayout
      eyebrow="Deep dive"
      title="Read of the week"
      description="One paper or book worth your time, with a three-sentence digest."
    >
      <Carousel setApi={setApi} opts={{ align: "start", loop: false }}>
        <CarouselContent>
          {CARDS.map((card, i) => (
            <CarouselItem key={i}>
              <article className="rounded-2xl border border-primary/30 bg-card p-6 shadow-card sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/80 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {card.type}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <h2 className="font-serif text-xl font-semibold text-foreground">
                        {card.title}
                      </h2>
                    </div>
                    <p className="mt-1 font-sans text-sm text-muted-foreground">
                      {card.author}
                    </p>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {card.summary}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {card.sentences.map((s, j) => (
                        <li
                          key={j}
                          className="flex gap-3 text-sm leading-relaxed text-foreground"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Why it matters: {card.whyItMatters}
                      </span>
                      {card.link && (
                        <a
                          href={card.link.href}
                          className="font-sans text-xs font-medium uppercase tracking-[0.12em] text-primary hover:underline"
                        >
                          {card.link.label} →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to card ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={
                  "h-2 w-2 rounded-full transition-colors " +
                  (i === current ? "bg-primary" : "bg-border hover:bg-muted-foreground/50")
                }
              />
            ))}
          </div>
          <div className="relative flex items-center gap-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </div>
      </Carousel>
    </SiteLayout>
  );
}