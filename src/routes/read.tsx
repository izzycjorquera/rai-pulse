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
import { READS, type ReadItem, type ReadType } from "@/content/reads";

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

const TYPE_LABEL: Record<ReadType, string> = {
  paper: "Paper",
  book: "Book",
  listen: "Listen",
};

const LINK_LABEL: Record<ReadType, string> = {
  paper: "Read the paper",
  book: "Find the book",
  listen: "Listen",
};

function ReadOfTheWeekPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(READS.length);

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
          {READS.map((item, i) => (
            <CarouselItem key={i}>
              <ReadCard item={item} />
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

function ReadCard({ item }: { item: ReadItem }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
      <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start">
        <div className="md:w-1/3 md:shrink-0">
          <Cover item={item} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-primary">
            {TYPE_LABEL[item.type]}
          </span>
          <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight text-foreground sm:text-[26px]">
            {item.title}
          </h2>
          <p className="mt-2 caption text-muted-foreground">
            {item.authorOrShow} · {item.year}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">
            {item.digest}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal"
              style={{ backgroundColor: "var(--lime)" }}
            >
              Why it matters: {item.whyItMatters}
            </span>
            <a
              href={item.link}
              target={item.link.startsWith("http") ? "_blank" : undefined}
              rel={item.link.startsWith("http") ? "noopener noreferrer" : undefined}
              className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-primary hover:underline"
            >
              {LINK_LABEL[item.type]} →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function Cover({ item }: { item: ReadItem }) {
  const [imgOk, setImgOk] = useState(true);
  const showFallback = !item.imageUrl || !imgOk;
  return (
    <div
      className="mx-auto aspect-[2/3] w-full max-w-[240px] overflow-hidden rounded-xl shadow-[0_18px_40px_-20px_rgba(31,29,26,0.45)] md:mx-0"
      style={{ transform: "rotate(-2deg)" }}
    >
      {showFallback ? (
        <TypographicCover item={item} />
      ) : (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover"
          onError={() => setImgOk(false)}
        />
      )}
    </div>
  );
}

function TypographicCover({ item }: { item: ReadItem }) {
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between p-4 sm:p-5"
      style={{ backgroundColor: "var(--navy)", color: "var(--cream)" }}
    >
      <span
        className="self-start rounded-full px-2 py-0.5 font-sans text-[9.5px] font-semibold uppercase tracking-[0.18em]"
        style={{ backgroundColor: "color-mix(in oklab, var(--cream) 12%, transparent)", color: "var(--cream)" }}
      >
        {TYPE_LABEL[item.type]}
      </span>
      <div>
        <h3
          className="font-display font-bold leading-[1.05]"
          style={{ fontSize: "clamp(1.05rem, 2.2vw, 1.4rem)" }}
        >
          {item.title}
        </h3>
        <div
          className="mt-3 h-[2px] w-14"
          style={{ backgroundColor: "var(--teal)" }}
        />
        <p className="mt-3 font-sans text-[10.5px] uppercase tracking-[0.14em] text-cream/70" style={{ color: "color-mix(in oklab, var(--cream) 70%, transparent)" }}>
          {item.authorOrShow} · {item.year}
        </p>
      </div>
    </div>
  );
}