import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: SITE.lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
