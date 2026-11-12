import type { MetadataRoute } from "next";

import { readManifest } from "@/lib/manifest.server";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const manifest = readManifest();
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/data`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...manifest.types.map((type) => ({
      url: `${SITE_URL}/browse/${type.key}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: type.primary ? 0.9 : 0.6,
    })),
  ];
}
