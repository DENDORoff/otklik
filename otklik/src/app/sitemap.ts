import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/login", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/legal/privacy", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/legal/consent", priority: 0.6, changeFrequency: "yearly" as const },
    { path: "/legal/terms", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/legal/cookies", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/legal/refund", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/legal/licenses", priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/data-request", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  return pages.map((page) => ({
    url: `${siteUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
