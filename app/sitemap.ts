import type { MetadataRoute } from "next";
import { ALL_PRODUCTS } from "@/components/shop/data";
import { ALL_ARTICLES } from "@/components/news/data";

const BASE_URL = "https://www.okelcor.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Static routes ──────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // SEO-canonical routes (Phase 2 — old /quote and /about now 301 here)
    {
      url: `${BASE_URL}/tyre-supply-quotation`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/wholesale-tire-distributors-europe`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tyre-wholesaler`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    // SEO catalogue landing pages — Phase 4A
    { url: `${BASE_URL}/passenger-tires`,   lastModified: now, changeFrequency: "weekly"  as const, priority: 0.85 },
    { url: `${BASE_URL}/light-truck-tires`, lastModified: now, changeFrequency: "weekly"  as const, priority: 0.85 },
    { url: `${BASE_URL}/summer-tires`,      lastModified: now, changeFrequency: "weekly"  as const, priority: 0.8  },
    { url: `${BASE_URL}/winter-tires`,      lastModified: now, changeFrequency: "weekly"  as const, priority: 0.8  },
    { url: `${BASE_URL}/all-season-tires`,  lastModified: now, changeFrequency: "weekly"  as const, priority: 0.8  },
    { url: `${BASE_URL}/michelin-tires`,    lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    { url: `${BASE_URL}/bridgestone-tires`, lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    { url: `${BASE_URL}/continental-tires`, lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    { url: `${BASE_URL}/pirelli-tires`,     lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    { url: `${BASE_URL}/goodyear-tires`,    lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    { url: `${BASE_URL}/dunlop-tires`,      lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    { url: `${BASE_URL}/falken-tires`,      lastModified: now, changeFrequency: "weekly"  as const, priority: 0.75 },
    {
      url: `${BASE_URL}/news`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/fet`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // ── Dynamic product routes ─────────────────────────────────────────────────
  const productRoutes: MetadataRoute.Sitemap = ALL_PRODUCTS.map((product) => ({
    url: `${BASE_URL}/shop/${product.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ── Dynamic article routes ─────────────────────────────────────────────────
  const articleRoutes: MetadataRoute.Sitemap = ALL_ARTICLES.map((article) => ({
    url: `${BASE_URL}/news/${article.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...productRoutes, ...articleRoutes];
}
