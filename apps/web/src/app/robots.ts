import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // API routes and the sign-in-gated demo workspace are not public content (demo pages are also noindex).
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/demo"] },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
