import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/** Site-wide analytics. GTM takes priority over direct GA4 to avoid duplicate tracking. */
export function Analytics() {
  return (
    <>
      {GTM_ID ? (
        <GoogleTagManager gtmId={GTM_ID} />
      ) : GA_ID ? (
        <GoogleAnalytics gaId={GA_ID} />
      ) : null}
      <VercelAnalytics />
    </>
  );
}
