import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Frame-Options",   value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy",   value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source:      "/quote",
        destination: "/tyre-supply-quotation",
        permanent:   true,
      },
      {
        source:      "/about",
        destination: "/wholesale-tire-distributors-europe",
        permanent:   true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "300mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "http",  hostname: "localhost",                    port: "8000" },
      { protocol: "https", hostname: "api.okelcor.de" },
      { protocol: "https", hostname: "api.okelcor.com" },
      { protocol: "https", hostname: "api.takeovercreatives.com" },
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org:     process.env.SENTRY_ORG     ?? "okelcor",
  project: process.env.SENTRY_PROJECT ?? "okelcor",

  // Suppress CLI output unless running in CI (keeps local builds clean)
  silent: !process.env.CI,

  // Upload wider set of source maps so stack traces resolve correctly
  widenClientFileUpload: true,

  // Don't expose source maps in the deployed client bundle
  sourcemaps: { disable: true },

  // Remove Sentry logger calls from production bundle (~3 kB saving)
  disableLogger: true,

  // Auto-instrument Vercel cron jobs as Sentry Cron Monitors
  automaticVercelMonitors: true,
});
