"use client";

import { useEffect } from "react";

/**
 * In-page links (`href="#demo"`) scroll to their section without putting a #fragment in the
 * address bar. The hrefs stay as anchors so crawlers and no-JS visitors can still follow them.
 */
export function SectionLinks() {
  useEffect(() => {
    const behavior = (): ScrollBehavior =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    // Arriving on an old shared link like /#demo: show that section, then drop the fragment.
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      history.replaceState(null, "", location.pathname + location.search);
      if (el && el.id !== "top") el.scrollIntoView({ block: "start" });
    }

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href")!.slice(1);
      e.preventDefault();
      if (!id || id === "top") {
        window.scrollTo({ top: 0, behavior: behavior() });
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: behavior(), block: "start" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
