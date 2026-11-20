import { Mail } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/site";
import ParticlesBg from "@/components/ui/particles-bg";
import { SREnityLogo } from "./Logo";

export function Footer() {
  return (
    <footer className="tone-dark relative overflow-hidden pt-14 pb-8 sm:pt-20 sm:pb-10">
      <ParticlesBg className="absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex flex-col gap-6 border-t border-border pt-8 sm:gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SREnityLogo size="sm" />
            <p className="mt-3 font-mono text-xs text-muted-foreground">
              {SITE.tagline}
            </p>
          </div>
          <nav aria-label="Footer" className="-my-2 flex flex-wrap gap-x-6 text-sm text-muted-foreground sm:gap-y-1">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="py-2 transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
            <a href="#early-access" className="py-2 transition-colors hover:text-foreground">
              Early access
            </a>
          </nav>
          <a
            href={`mailto:${SITE.email}`}
            className="inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-signal"
          >
            <Mail className="h-4 w-4" /> {SITE.email}
          </a>
        </div>
        <p className="mt-8 text-xs text-muted-foreground sm:mt-10">
          © {SITE.lastModified.slice(0, 4)} {SITE.name}. Coming soon.
        </p>
      </div>
    </footer>
  );
}
