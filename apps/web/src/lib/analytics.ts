import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";

type GtagParams = Record<string, string | number | boolean | undefined>;

/** Send an event through the configured Google integration; otherwise do nothing. */
export function track(name: string, params?: GtagParams) {
  if (typeof window === "undefined") return;

  if (process.env.NEXT_PUBLIC_GTM_ID) {
    sendGTMEvent({ ...params, event: name });
  } else if (process.env.NEXT_PUBLIC_GA_ID) {
    sendGAEvent("event", name, params ?? {});
  }
}
