import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Feed" },
  { to: "/themes", label: "Themes" },
  { to: "/radar", label: "Radar" },
  { to: "/about", label: "About" },
] as const;

export function SiteLayout({
  children,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              RAI Pulse
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · AI governance briefing
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{
                  className:
                    "rounded-md px-3 py-1.5 bg-secondary text-foreground",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="mb-10 max-w-3xl">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-primary">
              <span className="h-px w-6 bg-primary/60" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} RAI Pulse. Curated briefing — not legal advice.</span>
          <span>Built as a portfolio project.</span>
        </div>
      </footer>
    </div>
  );
}

export function TagBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary/80 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  );
}