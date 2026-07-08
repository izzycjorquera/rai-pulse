import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";

const NAV = [
  { to: "/", label: "This Week" },
  { to: "/read", label: "Read of the Week" },
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
      <header className="sticky top-0 z-30 bg-masthead text-masthead-foreground shadow-[0_1px_0_0_color-mix(in_oklab,#000_20%,transparent)]">
        <div className="h-1 w-full bg-lime/70" />
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-6 sm:py-8">
          <Link
            to="/"
            className="flex items-center justify-center gap-5 sm:gap-8"
            aria-label="Responsible AI Pulse — home"
          >
            <span className="wordmark">Responsible</span>
            <LogoSlot />
            <span className="wordmark">Pulse</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-1 font-sans text-sm">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-masthead-foreground/70 transition-colors hover:bg-white/10 hover:text-masthead-foreground"
                activeProps={{
                  className:
                    "rounded-md px-3 py-1.5 bg-white/10 text-masthead-foreground",
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
            <div className="mb-4 inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-8 bg-primary/70" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl font-sans text-base leading-[1.6] text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <hr className="mb-10 border-border" />
        {children}
      </main>

      <footer className="bg-masthead text-masthead-foreground">
        <div className="h-1 w-full bg-lime/70" />
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 font-sans text-[11px] uppercase tracking-[0.12em] text-masthead-foreground/70 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} RAI Pulse · Curated briefing, not legal advice</span>
          <span>Built as a portfolio project</span>
        </div>
      </footer>
    </div>
  );
}

export function TagBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 font-sans text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </span>
  );
}

function LogoSlot() {
  const [hasLogo, setHasLogo] = useState(true);
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-16 sm:w-16"
      aria-hidden={!hasLogo}
    >
      {hasLogo ? (
        <img
          src="/masthead-logo.png"
          alt="Responsible AI Pulse logo"
          className="h-full w-full object-contain"
          onError={() => setHasLogo(false)}
        />
      ) : (
        <span className="wordmark">AI</span>
      )}
    </span>
  );
}