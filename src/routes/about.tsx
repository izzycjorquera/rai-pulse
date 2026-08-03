import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Linkedin } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | RAI Pulse" },
      {
        name: "description",
        content: "About RAI Pulse: a personal, curated briefing on AI governance and geopolitics.",
      },
      { property: "og:title", content: "About | RAI Pulse" },
      {
        property: "og:description",
        content: "A personal briefing on AI governance and geopolitics.",
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
      description="A weekly briefing on AI governance and geopolitics."
    >
      <div className="max-w-2xl space-y-12">
        <section className="space-y-5 text-base leading-relaxed text-foreground/90">
          <h2 className="font-serif text-xl font-semibold text-foreground">About Me</h2>
          <p>
            I'm a Responsible AI Analyst at Swift, where I support the governance tools, frameworks
            and assessments that help ensure AI is deployed in line with ethical principles and
            regulatory expectations.
          </p>
          <p>
            My background is in international politics. I came to responsible AI from the questions
            of ethics, power and accountability that sit underneath the technology, rather than from
            engineering. That lens shapes how I read this space.
          </p>
          <p>
            Alongside my work in AI governance, I care about the broader intersection of business,
            technology and society; how organisations can be held to account and drive positive
            change, not just stay compliant.
          </p>
          <p className="pt-2 font-medium text-foreground">ISABEL JORQUERA</p>

          <a
            href="https://www.linkedin.com/in/isabel-jorquera-33826b191/"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-8 flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md sm:w-fit sm:min-w-[320px]"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Linkedin size={22} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="font-serif text-base font-semibold leading-tight text-foreground">
                Connect on LinkedIn
              </p>
              <p className="mt-0.5 font-sans text-sm text-muted-foreground">
                Isabel Jorquera · Responsible AI
              </p>
            </div>
          </a>
        </section>

        <section className="space-y-5 text-base leading-relaxed text-foreground/90">
          <h2 className="font-serif text-xl font-semibold text-foreground">About This Website</h2>
          <p>
            I built RAI Pulse to solve my own problem: keeping up with AI governance news is easy;
            understanding what it actually means for organisations is not. It's a weekly briefing
            that tracks what's happening across AI governance and translates why it matters: going
            past “a new regulation passed” to the strategic and compliance questions underneath,
            particularly as rules diverge across regional blocs.
          </p>
          <p>
            Everything here is analysis, not opinion. The perspective shows in what I choose to
            cover and which implications I flag.
          </p>
          <p>
            I also built the site itself, as an exercise in applied AI. The summaries are
            AI-assisted; the judgment is mine.
          </p>
        </section>
      </div>
    </SiteLayout>
  );
}
