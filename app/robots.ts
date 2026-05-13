import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/shop",
          "/news",
          "/contact",
          "/fet",
          "/tyre-supply-quotation",
          "/wholesale-tire-distributors-europe",
        ],
        disallow: [
          "/admin",
          "/account",
          "/checkout",
          "/api",
        ],
      },
    ],
    sitemap: "https://www.okelcor.com/sitemap.xml",
  };
}
