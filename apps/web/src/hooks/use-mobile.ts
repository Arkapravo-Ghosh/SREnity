"use client";

import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

function subscribe(change: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", change);
  return () => media.removeEventListener("change", change);
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(MOBILE_QUERY).matches, () => false);
}
