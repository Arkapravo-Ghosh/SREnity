"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { NAV_LINKS } from "@/lib/site";
import { SREnityLogo } from "./Logo";

const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1));

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently under the navbar.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((cur) => (cur === entry.target.id ? null : cur));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  // While the mobile menu is open: Escape or widening to desktop closes it, and the page can't scroll behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 768px)");
    const onDesktop = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  // Scrolling itself is handled page-wide by <SectionLinks />, which keeps # out of the URL.
  const close = () => setOpen(false);
  const toSignup = () => {
    track("cta_click", { location: "navbar" });
    close();
  };

  return (
    <>
      <header
        className={cn(
          "tone-dark fixed inset-x-0 top-0 z-50 border-b bg-transparent transition-colors duration-300",
          scrolled || open ? "border-border bg-background/95 backdrop-blur-sm" : "border-transparent",
        )}
      >
        <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:h-16">
          <a href="#top" onClick={close} aria-label="SREnity home">
            <SREnityLogo />
          </a>

          <div className="hidden items-center gap-5 md:flex lg:gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                aria-current={active === l.href.slice(1) ? "true" : undefined}
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  active === l.href.slice(1) ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {l.label}
              </a>
            ))}
            <a
              href="#early-access"
              onClick={toSignup}
              className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get early access
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <button
            className="-mr-2.5 flex h-11 w-11 items-center justify-center text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {open && (
          <div
            id="mobile-menu"
            className="flex flex-col gap-1 border-t border-border px-5 pb-5 pt-2 md:hidden"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="border-b border-border py-3.5 text-base text-foreground"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#early-access"
              onClick={toSignup}
              className="mt-4 rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
            >
              Get early access
            </a>
          </div>
        )}
      </header>
      {/* Tap outside the menu to close it. A sibling of the header: the header's backdrop blur would
        otherwise become the containing block for this fixed layer. */}
      {open && <div aria-hidden className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={close} />}
    </>
  );
}
