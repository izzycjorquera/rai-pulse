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