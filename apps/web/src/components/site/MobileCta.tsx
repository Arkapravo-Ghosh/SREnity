"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Phones only: a sign-up bar pinned to the bottom once the hero's own CTAs scroll away. It hides
 * again when the early-access form comes into view, so it never covers the form or the footer.
 */
export function MobileCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const form = document.getElementById("early-access");
    if (!hero || !form) return;
    const update = () => {
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      const beforeForm = form.getBoundingClientRect().top > window.innerHeight;
      setShow(pastHero && beforeForm);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={cn(
        "tone-dark fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <a
        href="#early-access"
        tabIndex={show ? undefined : -1}
        onClick={() => track("cta_click", { location: "mobile_bar" })}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
      >
        Get early access <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
